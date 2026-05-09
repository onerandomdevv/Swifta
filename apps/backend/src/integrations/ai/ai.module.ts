import { Module } from "@nestjs/common";
import { GeminiClient } from "./gemini.client";
import { GoogleVisionClient } from "./google-vision.client";

@Module({
  providers: [GeminiClient, GoogleVisionClient],
  exports: [GeminiClient, GoogleVisionClient],
})
export class AiModule {}
