import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariantsDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class VariantService {
  constructor(private readonly prisma: PrismaService) {}

  async addVariants(
    sellerId: number,
    productId: number,
    createVariantsDto: CreateVariantsDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('無權限修改此商品');
    }

    const variantsData = createVariantsDto.variants.map((variant) => ({
      ...variant,
      productId,
    }));

    await this.prisma.productVariant.createMany({
      data: variantsData,
    });

    return this.prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true },
    });
  }

  async updateVariant(
    sellerId: number,
    variantId: number,
    updateVariantDto: UpdateVariantDto,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('商品款式不存在');
    }

    if (variant.product.sellerId !== sellerId) {
      throw new ForbiddenException('無權限修改此商品款式');
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: updateVariantDto,
    });
  }

  async deleteVariant(sellerId: number, variantId: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('商品款式不存在');
    }

    if (variant.product.sellerId !== sellerId) {
      throw new ForbiddenException('無權限刪除此商品款式');
    }

    await this.prisma.productVariant.delete({
      where: { id: variantId },
    });

    return { message: '商品款式已成功刪除' };
  }
} 