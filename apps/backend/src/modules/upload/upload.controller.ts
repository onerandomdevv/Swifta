import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const url = await this.uploadService.uploadImageToCloudinary(file);
      return {
        url,
        message: 'File uploaded successfully',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Error uploading file');
    }
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }

    try {
      const url = await this.uploadService.uploadImageToCloudinary(file, 'hardware-os/products');
      return {
        url,
        message: 'Product image uploaded successfully',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Error uploading image');
    }
  }
}
