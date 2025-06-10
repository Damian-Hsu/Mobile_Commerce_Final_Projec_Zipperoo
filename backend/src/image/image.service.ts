import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

type UserPayload = { id: number; role: 'BUYER' | 'SELLER' | 'ADMIN' };

@Injectable()
export class ImageService {
  constructor(private readonly prisma: PrismaService) {}

  async createImageRecords(
    productId: number,
    files: Express.Multer.File[],
    user: UserPayload,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (product.sellerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to add images to this product.');
    }

    if (product.images.length + files.length > 8) {
      // Clean up uploaded files before throwing error
      for (const file of files) {
        await fs.unlink(file.path);
      }
      throw new ForbiddenException('A product can have a maximum of 8 images.');
    }

    const createdImages = await this.prisma.$transaction(
      files.map((file) =>
        this.prisma.productImage.create({
          data: {
            productId: productId,
            url: `/uploads/${file.filename}`,
          },
        }),
      ),
    );

    return createdImages;
  }

  async deleteImage(imageId: number, user: UserPayload) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: true },
    });

    if (!image) {
      throw new NotFoundException('Image not found.');
    }

    if (image.product.sellerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to delete this image.');
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), image.url);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Log error but proceed to delete from DB. Maybe the file was already deleted.
      console.error(`Failed to delete image file at ${filePath}:`, error);
    }

    // Delete record from database
    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    return { message: 'Image deleted successfully.' };
  }

  async getImageByFilename(filename: string) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        url: {
          contains: filename,
        },
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found.');
    }

    return {
      id: image.id,
      filename: path.basename(image.url),
      url: image.url,
    };
  }

  async getImageById(imageId: number) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image not found.');
    }

    return {
      id: image.id,
      filename: path.basename(image.url),
      url: image.url,
    };
  }
} 