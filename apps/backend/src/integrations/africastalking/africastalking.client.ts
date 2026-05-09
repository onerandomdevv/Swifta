import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import africastalking from "africastalking";

@Injectable()
export class AfricasTalkingClient {
  private readonly logger = new Logger(AfricasTalkingClient.name);
  private readonly senderId: string;
  private sms: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("africastalking.apiKey");
    const username = this.configService.get<string>("africastalking.username");
    this.senderId =
      this.configService.get<string>("africastalking.senderId") || "";

    if (!apiKey) {
      this.logger.warn(
        "Africa's Talking API key is missing. SMS functionality will be disabled.",
      );
      return;
    }

    try {
      const sdk = africastalking({ apiKey, username });
      this.sms = sdk.SMS;
      this.logger.log("Africa's Talking SDK initialized successfully.");
    } catch (error) {
      this.logger.error("Failed to initialize Africa's Talking SDK", error);
    }
  }

  async sendSms(to: string, message: string): Promise<any> {
    if (!this.sms) {
      this.logger.warn(
        `Skipping SMS to ${to}: Service is poorly configured or disabled.`,
      );
      return;
    }

    const options: any = {
      to: [to],
      message,
    };

    if (this.senderId) {
      options.from = this.senderId;
    }

    const response = await this.sms.send(options);

    this.logger.log(
      `SMS dispatched to ${to}. MessageId: ${response?.SMSMessageData?.Recipients?.[0]?.messageId}`,
    );

    return response;
  }
}
