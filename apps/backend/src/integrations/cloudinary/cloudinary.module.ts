import { Module } from "@nestjs/common";
import { CloudinaryClient } from "./cloudinary.client";

@Module({
  providers: [CloudinaryClient],
  exports: [CloudinaryClient],
})
export class CloudinaryModule {}
