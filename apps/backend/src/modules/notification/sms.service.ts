import { Injectable, Logger } from "@nestjs/common";
import { AfricasTalkingClient } from "../../integrations/africastalking/africastalking.client";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private africasTalkingClient: AfricasTalkingClient) {}

  /**
   * Dispatches an SMS to a specified phone number using Africa's Talking.
   * @param phoneNumber Phone number must be in E.164 format (e.g., +2348147846093).
   *
   * @param to The recipient's phone number
   * @param message The message body
   */
  async sendSms(to: string, message: string): Promise<any> {
    // A fast regex to ensure the number loosely matches E.164 structure before sending
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(to)) {
      this.logger.error(
        `Failed to send SMS: Invalid phone number format for ${to}. Must be E.164 (e.g. +234...)`,
      );
      throw new Error("Invalid phone number format");
    }

    try {
      return await this.africasTalkingClient.sendSms(to, message);
    } catch (error: any) {
      this.logger.error(
        `SMS dispatch failed for ${to}`,
        error?.response?.data || error.message,
      );
      throw error;
    }
  }
}
