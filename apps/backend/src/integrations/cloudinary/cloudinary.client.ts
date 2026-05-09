import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";
import { CLOUDINARY_TRANSFORMS } from "./cloudinary-transforms";

@Injectable()
export class CloudinaryClient {
  private readonly logger = new Logger(CloudinaryClient.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("cloudinary.cloudName"),
      api_key: this.configService.get<string>("cloudinary.apiKey"),
      api_secret: this.configService.get<string>("cloudinary.apiSecret"),
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    transformType?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: any = { folder };
      const transformation =
        transformType &&
        CLOUDINARY_TRANSFORMS[
          transformType as keyof typeof CLOUDINARY_TRANSFORMS
        ];

      if (transformation) {
        options.transformation = transformation;
      }

      const upload = cloudinary.uploader.upload_stream(
        options,
        (error: any, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error("Cloudinary upload failed", error);
            return reject(
              error ?? new Error("Failed to upload file to Cloudinary."),
            );
          }

          resolve(result.secure_url);
        },
      );

      Readable.from(buffer).pipe(upload);
    });
  }
}
