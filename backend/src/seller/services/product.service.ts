import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../common/services/log.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async createProduct(sellerId: number, createProductDto: CreateProductDto) {
    const { variants, imageUrls, ...productData } = createProductDto;

    try {
      return await this.prisma.$transaction(async (tx: any) => {
        console.log('開始創建商品，賣家ID:', sellerId);
        console.log('商品數據:', productData);
        console.log('圖片URLs:', imageUrls);
        console.log('規格數據:', variants);

        const product = await tx.product.create({
          data: {
            sellerId,
            ...productData,
            status: productData.status || 'ON_SHELF',
          },
        });

        console.log('商品創建成功，ID:', product.id);

        // Create product variants if provided
        if (variants && variants.length > 0) {
          const variantsData = variants.map((variant) => ({
            ...variant,
            productId: product.id,
          }));
          console.log('準備創建規格:', variantsData);
          await tx.productVariant.createMany({
            data: variantsData,
          });
          console.log('規格創建成功');
        }

        // Create product images if provided
        if (imageUrls && imageUrls.length > 0) {
          console.log('準備創建圖片記錄，數量:', imageUrls.length);
          // 過濾掉空的或無效的URL
          const validUrls = imageUrls.filter(url => url && url.trim().length > 0);
          console.log('有效的圖片URLs:', validUrls);
          
          if (validUrls.length > 0) {
            const imageData = validUrls.map((url: string) => ({
              productId: product.id,
              url: url.trim(),
            }));
            console.log('準備插入的圖片數據:', imageData);
            
            await tx.productImage.createMany({
              data: imageData,
            });
            console.log('圖片記錄創建成功');
          }
        }

        await this.logService.record(
          'PRODUCT_CREATED', 
          sellerId, 
          `創建商品 ${product.name}`,
          undefined, // ipAddress
          {
            productId: product.id,
            productName: product.name,
          }
        );

        console.log('日誌記錄完成，準備返回商品數據');

        return await tx.product.findUnique({
          where: { id: product.id },
          include: {
            images: true,
            category: true,
            variants: true,
          },
        });
      });
    } catch (error) {
      console.error('創建商品時發生錯誤:', error);
      console.error('錯誤堆疊:', error.stack);
      throw error;
    }
  }

  async getProducts(sellerId: number, page: number = 1, pageSize: number = 10, search?: string, status?: string) {
    const skip = (page - 1) * pageSize;

    // 構建搜尋條件
    const whereCondition: any = {
      sellerId,
      status: { not: 'DELETED' },
    };

    // 如果有搜尋關鍵字，添加搜尋條件
    if (search && search.trim()) {
      console.log('🔍 後端收到搜尋關鍵字:', search.trim());
      // 簡化搜尋條件，只搜尋商品名稱（不區分大小寫）
      whereCondition.name = {
        contains: search.trim(),
        mode: 'insensitive', // 不區分大小寫
      };
      console.log('🔍 搜尋條件:', JSON.stringify(whereCondition, null, 2));
    }

    // 如果有狀態過濾，添加狀態條件
    if (status && status.trim()) {
      console.log('🔍 後端收到狀態過濾:', status.trim());
      if (status === 'OUT_OF_STOCK') {
        // 缺貨狀態需要特殊處理，先不在這裡過濾，後面會在應用層處理
        console.log('🔍 缺貨狀態將在應用層處理');
      } else {
        // 其他狀態直接過濾
        whereCondition.status = status.trim();
        console.log('🔍 狀態過濾條件:', status.trim());
      }
    }

    // 如果是缺貨狀態過濾，需要特殊處理
    if (status === 'OUT_OF_STOCK') {
      // 先獲取所有商品（不分頁），然後過濾缺貨商品
      const allProducts = await this.prisma.product.findMany({
        where: whereCondition,
        include: {
          images: true,
          category: true,
          variants: true,
          reviews: {
            where: { isDeleted: false },
          },
          _count: {
            select: {
              reviews: {
                where: { isDeleted: false },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 過濾出缺貨商品
      const outOfStockProducts = allProducts.filter(product => {
        const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
        return totalStock === 0;
      });

      // 手動分頁
      const total = outOfStockProducts.length;
      const products = outOfStockProducts.slice(skip, skip + pageSize);

      const [enrichedProducts] = await Promise.all([
        Promise.all(
          products.map(async (product) => {
            // 計算價格範圍
            const prices = product.variants?.map(v => v.price) || [];
            if (prices.length === 0) prices.push(0);
            
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            // 計算平均評分
            const ratings = product.reviews?.map(r => r.score) || [];
            const avgRating = ratings.length > 0 
              ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
              : 0;

            // 計算銷售數量
            const soldQuantity = await this.prisma.orderItem.aggregate({
              where: {
                productVariant: {
                  productId: product.id,
                },
                order: {
                  status: { in: ['UNCOMPLETED', 'COMPLETED','CANCELED'] },
                },
              },
              _sum: {
                quantity: true,
              },
            });

            return {
              ...product,
              minPrice,
              maxPrice,
              avgRating: Math.round(avgRating * 10) / 10, // 保留一位小數
              soldQuantity: soldQuantity._sum.quantity || 0,
            };
          })
        )
      ]);

      return {
        data: enrichedProducts,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }

    // 正常的分頁查詢（非缺貨狀態）
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereCondition,
        include: {
          images: true,
          category: true,
          variants: true,
          reviews: {
            where: { isDeleted: false },
          },
          _count: {
            select: {
              reviews: {
                where: { isDeleted: false },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({
        where: whereCondition,
      }),
    ]);

    // 為每個產品計算額外的統計資料
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        // 計算價格範圍
        const prices = product.variants?.map(v => v.price) || [];
        if (prices.length === 0) prices.push(0);
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // 計算平均評分
        const ratings = product.reviews?.map(r => r.score) || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        // 計算銷售數量
        const soldQuantity = await this.prisma.orderItem.aggregate({
          where: {
            productVariant: {
              productId: product.id,
            },
            order: {
              status: { in: ['UNCOMPLETED', 'COMPLETED','CANCELED'] },
            },
          },
          _sum: {
            quantity: true,
          },
        });

        return {
          ...product,
          minPrice,
          maxPrice,
          avgRating: Math.round(avgRating * 10) / 10, // 保留一位小數
          soldQuantity: soldQuantity._sum.quantity || 0,
        };
      })
    );

    return {
      data: enrichedProducts,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getProduct(sellerId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        status: { not: 'DELETED' },
      },
      include: {
        images: true,
        category: true,
        variants: true,
        reviews: {
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          where: {
            isDeleted: false,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return product;
  }

  async updateProduct(sellerId: number, productId: number, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        status: { not: 'DELETED' },
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('商品不存在');
    }

    const { variants, imageUrls, ...productData } = updateProductDto;

    return await this.prisma.$transaction(async (tx: any) => {
      // Update product basic info
      await tx.product.update({
        where: { id: productId },
        data: productData,
      });

      // Update variants if provided
      if (variants && variants.length > 0) {
        console.log(`=== 開始更新商品 ${productId} 的 variants ===`);
        console.log('新的 variants 數據:', variants);
        
        // 檢查是否有現有的 variants 被訂單或購物車使用
        const existingVariants = await tx.productVariant.findMany({
          where: { productId },
          include: {
            orderItems: true,
            cartItems: true,
          },
        });
        
        console.log('現有的 variants:', existingVariants.map(v => ({
          id: v.id,
          name: v.name,
          productId: v.productId,
          hasOrderItems: v.orderItems.length > 0,
          hasCartItems: v.cartItems.length > 0
        })));

        // 分離有關聯的 variants 和沒有關聯的 variants
        const variantsWithRelations = existingVariants.filter(
          v => v.orderItems.length > 0 || v.cartItems.length > 0
        );
        const variantsWithoutRelations = existingVariants.filter(
          v => v.orderItems.length === 0 && v.cartItems.length === 0
        );

        // 處理有關聯的 variants
        console.log('有關聯的 variants 數量:', variantsWithRelations.length);
        const updatedVariantNames = new Set();
        for (const existingVariant of variantsWithRelations) {
          // 尋找對應的新 variant 數據（必須 productId 和 name 都相同）
          const matchingNewVariant = variants.find((v: any) => 
            v.name === existingVariant.name && existingVariant.productId === productId
          );
          
          if (matchingNewVariant) {
            console.log(`更新有關聯的 variant: ${existingVariant.name} (ID: ${existingVariant.id})`);
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                price: matchingNewVariant.price,
                stock: matchingNewVariant.stock,
              },
            });
            updatedVariantNames.add(existingVariant.name);
          } else {
            console.log(`有關聯的 variant "${existingVariant.name}" 沒有找到匹配的新數據，保持不變`);
          }
        }

        // 處理沒有關聯的 variants
        console.log('沒有關聯的 variants 數量:', variantsWithoutRelations.length);
        const updatedVariantNamesFromUnrelated = new Set();
        for (const existingVariant of variantsWithoutRelations) {
          // 尋找對應的新 variant 數據（必須 productId 和 name 都相同）
          const matchingNewVariant = variants.find((v: any) => 
            v.name === existingVariant.name && existingVariant.productId === productId
          );
          
          if (matchingNewVariant) {
            console.log(`更新沒有關聯的 variant: ${existingVariant.name} (ID: ${existingVariant.id})`);
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                price: matchingNewVariant.price,
                stock: matchingNewVariant.stock,
              },
            });
            updatedVariantNamesFromUnrelated.add(existingVariant.name);
          }
        }

        // 刪除沒有關聯且沒有對應新數據的 variants
        const variantsToDelete = variantsWithoutRelations.filter(
          v => !updatedVariantNamesFromUnrelated.has(v.name)
        );
        
        if (variantsToDelete.length > 0) {
          console.log('準備刪除的 variants:', variantsToDelete.map(v => ({ id: v.id, name: v.name })));
          await tx.productVariant.deleteMany({
            where: {
              id: { in: variantsToDelete.map(v => v.id) },
            },
          });
        }

        // 創建新的 variants（名稱在當前商品中不存在的）
        const allExistingVariantNames = existingVariants.map(v => v.name);
        const newVariants = variants.filter((v: any) => !allExistingVariantNames.includes(v.name));
        
        if (newVariants.length > 0) {
          console.log('準備創建新的 variants:', newVariants.map(v => ({ name: v.name, price: v.price, stock: v.stock })));
          await tx.productVariant.createMany({
            data: newVariants.map((variant: any) => ({
              productId,
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
            })),
          });
        } else {
          console.log('沒有需要創建的新 variants');
        }
        
        console.log(`=== 商品 ${productId} 的 variants 更新完成 ===`);
      }

      // Update images if provided and different from current
      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        // Get current images
        const currentImages = await tx.productImage.findMany({
          where: { productId },
          select: { id: true, url: true },
          orderBy: { id: 'asc' }
        });

        const currentUrls = currentImages.map(img => img.url).sort();
        const newUrls = imageUrls.filter(url => typeof url === 'string' && url.trim()).sort();

        // Check if images have actually changed
        const imagesChanged = currentUrls.length !== newUrls.length || 
                             !currentUrls.every((url, index) => url === newUrls[index]);

        if (imagesChanged) {
          console.log(`商品 ${productId} 的圖片有變化，進行更新`);
          console.log('當前圖片:', currentUrls);
          console.log('新圖片:', newUrls);

          // Find images to delete (current but not in new list)
          const urlsToDelete = currentUrls.filter(url => !newUrls.includes(url));
          const imagesToDelete = currentImages.filter(img => urlsToDelete.includes(img.url));

          // Find images to add (new but not in current list)
          const urlsToAdd = newUrls.filter(url => !currentUrls.includes(url));

          // Delete removed images
          if (imagesToDelete.length > 0) {
            console.log('刪除圖片:', imagesToDelete.map(img => img.url));
            await tx.productImage.deleteMany({
              where: {
                id: { in: imagesToDelete.map(img => img.id) }
              }
            });
          }

          // Add new images
          if (urlsToAdd.length > 0) {
            console.log('新增圖片:', urlsToAdd);
            await tx.productImage.createMany({
              data: urlsToAdd.map(url => ({
                productId,
                url
              }))
            });
          }
        } else {
          console.log(`商品 ${productId} 的圖片沒有變化，跳過圖片更新`);
        }
      } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length === 0) {
        // If explicitly setting empty images array, delete all images
        console.log(`商品 ${productId} 設置為無圖片，刪除所有現有圖片`);
        await tx.productImage.deleteMany({
          where: { productId }
        });
      }

      await this.logService.record(
        'PRODUCT_UPDATED', 
        sellerId, 
        `更新商品`,
        undefined, // ipAddress
        {
          productId,
          changes: updateProductDto,
        }
      );

      return await tx.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          category: true,
          variants: true,
        },
      });
    });
  }

  async deleteProduct(sellerId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        status: { not: 'DELETED' },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'DELETED' },
    });

    await this.logService.record(
      'PRODUCT_DELETED', 
      sellerId, 
      `刪除商品 ${product.name}`,
      undefined, // ipAddress
      {
        productId,
        productName: product.name,
      }
    );

    return { message: '商品已刪除' };
  }

  async getOrders(sellerId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              account: true,
            },
          },
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    include: {
                      images: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({
        where: { sellerId },
      }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async shipOrder(sellerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId,
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    if (order.status !== 'UNCOMPLETED') {
      throw new ForbiddenException('只能出貨未完成的訂單');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    await this.logService.record(
      'ORDER_SHIPPED', 
      sellerId, 
      `訂單出貨`,
      undefined, // ipAddress
      {
        orderId,
      }
    );

    return { message: '訂單已出貨' };
  }

  async completeOrder(sellerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId,
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    if (order.status === 'CANCELED') {
      throw new ForbiddenException('已取消的訂單無法完成');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    await this.logService.record(
      'ORDER_COMPLETED', 
      sellerId, 
      `訂單完成`,
      undefined, // ipAddress
      {
        orderId,
      }
    );

    return { message: '訂單已完成' };
  }

  async getProductStats(sellerId: number) {
    // 獲取總商品數（排除已刪除的商品）
    const totalProducts = await this.prisma.product.count({
      where: {
        sellerId,
        status: { not: 'DELETED' },
      },
    });

    // 獲取各狀態的商品數量
    const [onShelfCount, offShelfCount] = await Promise.all([
      // 上架商品數量
      this.prisma.product.count({
        where: {
          sellerId,
          status: 'ON_SHELF',
        },
      }),
      // 下架商品數量
      this.prisma.product.count({
        where: {
          sellerId,
          status: 'OFF_SHELF',
        },
      }),
    ]);

    // 計算缺貨商品數量（需要檢查商品變體的庫存）
    const productsWithVariants = await this.prisma.product.findMany({
      where: {
        sellerId,
        status: { not: 'DELETED' },
      },
      include: {
        variants: {
          select: {
            stock: true,
          },
        },
      },
    });

    const outOfStockCount = productsWithVariants.filter(product => {
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
      return totalStock === 0;
    }).length;

    return {
      total: totalProducts,
      onShelf: onShelfCount,
      offShelf: offShelfCount,
      outOfStock: outOfStockCount,
    };
  }
} 