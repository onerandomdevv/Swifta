import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import africastalking from "africastalking";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private atSdk: any;
  private sms: any;
  private senderId: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("africastalking.apiKey");
    const username = this.configService.get<string>("africastalking.username");
    this.senderId =
      this.configService.get<string>("africastalking.senderId") || "";

    if (!apiKey) {
      this.logger.warn(
        "Africa's Talking API key is missing. SMS functionality will be disabled.",
      );
    } else {
      try {
        this.atSdk = africastalking({ apiKey, username });
        this.sms = this.atSdk.SMS;
        this.logger.log("Africa's Talking SDK initialized successfully.");
      } catch (error) {
        this.logger.error("Failed to initialize Africa's Talking SDK", error);
      }
    }
  }

  /**
   * Dispatches an SMS to a specified phone number using Africa's Talking.
   * Phone number must be in E.164 format (e.g., 2348147846093).
   *
   * @param to The recipient's phone number
   * @param message The message body
   */
  async sendSms(to: string, message: string): Promise<any> {
    if (!this.sms) {
      this.logger.warn(
        `Skipping SMS to ${to}: Service is poorly configured or disabled.`,
      );
      return;
    }

    // A fast regex to ensure the number loosely matches E.164 structure before sending
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(to)) {
      this.logger.error(
        `Failed to send SMS: Invalid phone number format for ${to}. Must be E.164 (e.g. +234...)`,
      );
      throw new Error("Invalid phone number format");
    }

    try {
      const options: any = {
        to: [to],
        message,
      };

      // Only attach senderId if it is explicitly configured in the environment
      if (this.senderId) {
        options.from = this.senderId;
      }

      const response = await this.sms.send(options);

      this.logger.log(
        `SMS dispatched to ${to}. MessageId: ${response?.SMSMessageData?.Recipients?.[0]?.messageId}`,
      );
      return response;
    } catch (error: any) {
      this.logger.error(
        `SMS dispatch failed for ${to}`,
        error?.response?.data || error.message,
      );
      throw error;
    }
  }
}
