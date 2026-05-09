import { Module, Global } from "@nestjs/common";
import { EmailService } from "./email.service";
import { ResendModule } from "../../integrations/resend/resend.module";

@Global()
@Module({
  imports: [ResendModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
