import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ImageService } from './image.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import * as crypto from 'crypto';
import * as path from 'path';
import { ResponseDto } from 'src/common/dto/response.dto';
import { Public } from 'src/common/decorators/public.decorator';

// Define a type for the user payload for clarity
type UserPayload = { id: number; role: 'BUYER' | 'SELLER' | 'ADMIN' };

// Multer configuration
export const multerOptions = {
  // Enable file size limits
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  // Check the mimetypes to allow for upload
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      // Allow storage of file
      cb(null, true);
    } else {
      // Reject file
      cb(
        new HttpException(
          `Unsupported file type ${path.extname(file.originalname)}`,
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
  },
  // Storage properties
  storage: diskStorage({
    destination: './uploads',
    filename: (req: any, file: any, cb: any) => {
      const productId = req.params.productId;
      if (!productId) {
        return cb(new Error('Product ID is missing!'), null);
      }
      const timestamp = Date.now();
      const randomHash = crypto.createHash('md5').update(file.originalname + timestamp.toString()).digest('hex');
      const filename = `img-${productId}-${randomHash}${path.extname(
        file.originalname,
      )}`;
      cb(null, filename);
    },
  }),
};

@Controller()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('products/:productId/images')
  @Roles('SELLER', 'ADMIN', 'BUYER')
  @UseInterceptors(FilesInterceptor('images', 8, multerOptions))
  async uploadImages(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentUser() user: UserPayload,
  ) {
    if (!files || files.length === 0) {
        throw new HttpException('No files were uploaded.', HttpStatus.BAD_REQUEST);
    }
    const result = await this.imageService.createImageRecords(productId, files, user);
    return ResponseDto.success(result, 'Images uploaded successfully.');
  }

  @Delete('images/:imageId')
  @Roles('SELLER', 'ADMIN')
  async deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.imageService.deleteImage(imageId, user);
    return ResponseDto.success(result, result.message);
  }

  @Get('imagesFromName/:imgName')
  @Public()
  async getImageByFilename(@Param('imgName') imgName: string) {
    const result = await this.imageService.getImageByFilename(imgName);
    return ResponseDto.success(result, 'Image found successfully.');
  }

  @Get('imagesFromID/:imageId')
  @Public()
  async getImageById(@Param('imageId', ParseIntPipe) imageId: number) {
    const result = await this.imageService.getImageById(imageId);
    return ResponseDto.success(result, 'Image found successfully.');
  }
} 