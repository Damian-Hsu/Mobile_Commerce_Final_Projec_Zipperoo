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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
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

@ApiTags('圖片管理')
@Controller()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('products/:productId/images')
  @Roles('SELLER', 'ADMIN', 'BUYER')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 8, multerOptions))
  @ApiOperation({ summary: '上傳商品圖片', description: '為指定商品上傳圖片（最多8張）' })
  @ApiParam({ name: 'productId', type: 'number', description: '商品ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: '圖片上傳成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Images uploaded successfully.' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              filename: { type: 'string' },
              url: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '沒有上傳檔案或檔案格式錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '刪除圖片', description: '刪除指定的商品圖片' })
  @ApiParam({ name: 'imageId', type: 'number', description: '圖片ID' })
  @ApiResponse({ status: 200, description: '圖片刪除成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或不是圖片擁有者' })
  @ApiResponse({ status: 404, description: '圖片不存在' })
  async deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.imageService.deleteImage(imageId, user);
    return ResponseDto.success(result, result.message);
  }

  @Get('imagesFromName/:imgName')
  @Public()
  @ApiOperation({ summary: '根據檔名獲取圖片', description: '根據檔案名稱獲取圖片資訊' })
  @ApiParam({ name: 'imgName', type: 'string', description: '圖片檔案名稱' })
  @ApiResponse({ status: 200, description: '圖片獲取成功' })
  @ApiResponse({ status: 404, description: '圖片不存在' })
  async getImageByFilename(@Param('imgName') imgName: string) {
    const result = await this.imageService.getImageByFilename(imgName);
    return ResponseDto.success(result, 'Image found successfully.');
  }

  @Get('imagesFromID/:imageId')
  @Public()
  @ApiOperation({ summary: '根據ID獲取圖片', description: '根據圖片ID獲取圖片資訊' })
  @ApiParam({ name: 'imageId', type: 'number', description: '圖片ID' })
  @ApiResponse({ status: 200, description: '圖片獲取成功' })
  @ApiResponse({ status: 404, description: '圖片不存在' })
  async getImageById(@Param('imageId', ParseIntPipe) imageId: number) {
    const result = await this.imageService.getImageById(imageId);
    return ResponseDto.success(result, 'Image found successfully.');
  }
} 