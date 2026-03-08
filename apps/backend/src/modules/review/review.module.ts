import { Module, forwardRef } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { ReviewController } from "./review.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { ReviewPromptProcessor } from "./review.processor";
import { WhatsAppModule } from "../whatsapp/whatsapp.module";

@Module({
  imports: [PrismaModule, forwardRef(() => WhatsAppModule)],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewPromptProcessor],
  exports: [ReviewService],
})
export class ReviewModule {}
