import { Injectable, BadRequestException } from "@nestjs/common";
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { ConfigService } from "@nestjs/config";
import { Readable } from "stream";
import { CLOUDINARY_TRANSFORMS } from "./cloudinary-transforms";

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
    folder: string = "twizrr/merchants",
    transformType?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: any = { folder };
      if (
        transformType &&
        CLOUDINARY_TRANSFORMS[
          transformType as keyof typeof CLOUDINARY_TRANSFORMS
        ]
      ) {
        options.transformation =
          CLOUDINARY_TRANSFORMS[
            transformType as keyof typeof CLOUDINARY_TRANSFORMS
          ];
      }

      const upload = cloudinary.uploader.upload_stream(
        options,
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
