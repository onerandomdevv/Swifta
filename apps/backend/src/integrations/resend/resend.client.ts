import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class ResendClient {
  private readonly logger = new Logger(ResendClient.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("resend.apiKey");
    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>("resend.fromEmail") ||
      "onboarding@resend.dev";
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<string | undefined> {
    const { data, error } = await this.resend.emails.send({
      from: `twizrr <${this.fromEmail}>`,
      to: [to],
      subject: `twizrr | ${subject}`,
      html,
    });

    if (error) {
      this.logger.error(
        `Resend API Error: ${error.message} (to: ${to}, subject: ${subject})`,
      );
      throw new Error(`Resend API Error: ${error.message}`);
    }

    return data?.id;
  }
}
