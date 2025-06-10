import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../common/services/log.service';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async getCart(buyerId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { buyerId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: true,
                    seller: {
                      select: {
                        id: true,
                        username: true,
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('購物車不存在');
    }

    const totalAmount = cart.items
      .filter((item: any) => item.isSelected)
      .reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

    return { ...cart, totalAmount };
  }

  async addItem(buyerId: number, addCartItemDto: AddCartItemDto) {
    const { productVariantId, quantity } = addCartItemDto;

    // Check if product variant exists and is available
    const productVariant = await this.prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: { product: true },
    });

    if (!productVariant) {
      throw new NotFoundException('商品款式不存在');
    }

    if (productVariant.product.status !== 'ON_SHELF') {
      throw new BadRequestException('商品已下架');
    }

    if (productVariant.stock < quantity) {
      throw new BadRequestException('庫存不足');
    }

    // Get or create cart
    const cart = await this.prisma.cart.upsert({
      where: { buyerId },
      create: { buyerId },
      update: {},
    });

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > productVariant.stock) {
        throw new BadRequestException('庫存不足');
      }
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: productVariant.price,
        },
      });
    } else {
      // Create new cart item
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId,
          quantity,
          isSelected: false,
          unitPrice: productVariant.price,
        },
      });
    }
  }

  async updateItem(buyerId: number, itemId: number, updateCartItemDto: UpdateCartItemDto) {
    const { quantity, isSelected } = updateCartItemDto;

    // First check if the cart item belongs to this buyer
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { buyerId },
      },
      include: {
        productVariant: {
          include: { product: true },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('購物車項目不存在');
    }

    // If quantity is being updated, validate stock
    if (quantity !== undefined) {
      if (cartItem.productVariant.product.status !== 'ON_SHELF') {
        throw new BadRequestException('商品已下架');
      }

      if (cartItem.productVariant.stock < quantity) {
        throw new BadRequestException('庫存不足');
      }
    }

    // Build update data
    const updateData: any = {};
    if (quantity !== undefined) {
      updateData.quantity = quantity;
      updateData.unitPrice = cartItem.productVariant.price; // Update price if quantity changes
    }
    if (isSelected !== undefined) {
      updateData.isSelected = isSelected;
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        productVariant: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });
  }

  async removeItem(buyerId: number, itemId: number) {
    // First check if the cart item belongs to this buyer
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { buyerId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('購物車項目不存在');
    }

    await this.logService.record('CART_ITEM_REMOVED', buyerId, {
      cartItemId: itemId,
      productVariantId: cartItem.productVariantId,
    });

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
} 