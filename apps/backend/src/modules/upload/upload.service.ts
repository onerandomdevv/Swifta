import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { CloudinaryClient } from "../../integrations/cloudinary/cloudinary.client";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private cloudinaryClient: CloudinaryClient) {}

  async uploadImageToCloudinary(
    file: Express.Multer.File,
    folder: string = "twizrr/merchants",
    transformType?: string,
  ): Promise<string> {
    try {
      return await this.cloudinaryClient.uploadBuffer(
        file.buffer,
        folder,
        transformType,
      );
    } catch (error) {
      this.logger.error("Failed to upload file to Cloudinary", error);
      throw new BadRequestException("Failed to upload file to Cloudinary.");
    }
  }
}
