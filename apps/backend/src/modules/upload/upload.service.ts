import { Injectable, BadRequestException } from "@nestjs/common";
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { ConfigService } from "@nestjs/config";
import { Readable } from "stream";

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    // Initialize Cloudinary with environment variables
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
      // or optionally URL: this.configService.get<string>('CLOUDINARY_URL')
    });
  }

  async uploadImageToCloudinary(
    file: Express.Multer.File,
    folder: string = "hardware-os/merchants",
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            return reject(
              new BadRequestException("Failed to upload file to Cloudinary."),
            );
          }
          resolve(result.secure_url);
        },
      );

      // Convert buffer directly into a readable stream
      Readable.from(file.buffer).pipe(upload);
    });
  }
}
