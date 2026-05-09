import { Module } from "@nestjs/common";

import { EmailModule } from "../modules/email/email.module";
import { NotificationModule } from "../modules/notification/notification.module";
import { UploadModule } from "../modules/upload/upload.module";
import { UssdModule } from "../channels/ussd/ussd.module";
import { WhatsAppModule } from "../channels/whatsapp/whatsapp.module";

@Module({
  imports: [
    NotificationModule,
    EmailModule,
    WhatsAppModule,
    UssdModule,
    UploadModule,
  ],
})
export class ChannelsDomainModule {}
