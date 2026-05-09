import { Injectable, BadRequestException } from "@nestjs/common";
import { CloudinaryClient } from "../../integrations/cloudinary/cloudinary.client";

@Injectable()
export class UploadService {
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
    } catch {
      throw new BadRequestException("Failed to upload file to Cloudinary.");
    }
  }
}
