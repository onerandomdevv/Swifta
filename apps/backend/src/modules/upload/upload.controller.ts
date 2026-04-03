import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UploadService } from "./upload.service";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("document")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          return callback(
            new BadRequestException("Only image and PDF files are allowed"),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body("transformType") transformType?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    try {
      const url = await this.uploadService.uploadImageToCloudinary(
        file,
        "twizrr/documents",
        transformType,
      );
      return {
        url,
        message: "File uploaded successfully",
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || "Error uploading file");
    }
  }

  @Post("product-image")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException("Only image files (JPG, PNG) are allowed"),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("transformType") transformType?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No image uploaded");
    }

    try {
      const url = await this.uploadService.uploadImageToCloudinary(
        file,
        "twizrr/products",
        transformType,
      );
      return {
        url,
        message: "Product image uploaded successfully",
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || "Error uploading image");
    }
  }
}
