import { Injectable, ConflictException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CreateWaitlistDto } from "./dto/create-waitlist.dto";

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async create(createWaitlistDto: CreateWaitlistDto) {
    try {
      const entry = await this.prisma.merchantWaitlist.create({
        data: {
          businessName: createWaitlistDto.businessName,
          email: createWaitlistDto.email.toLowerCase(),
          phone: createWaitlistDto.phone,
        },
      });

      // Send Welcome Email to Merchant
      this.emailService
        .sendWelcomeEmail(entry.email, entry.businessName, "MERCHANT")
        .catch((err) =>
          this.logger.error(`Failed to send welcome email: ${err.message}`),
        );

      // Send Alert to Admin
      const adminEmail = this.configService.get<string>(
        "WAITLIST_NOTIFY_EMAIL",
      );
      if (
        adminEmail &&
        adminEmail !== "REPLACE_WITH_YOUR_PERSONAL_EMAIL@GMAIL.COM"
      ) {
        this.emailService
          .sendWaitlistAlert(
            adminEmail,
            entry.businessName,
            entry.email,
            entry.phone ?? "N/A",
          )
          .catch((err) =>
            this.logger.error(
              `Failed to send admin waitlist alert: ${err.message}`,
            ),
          );
      }

      return entry;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictException("This email is already on the waitlist");
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.merchantWaitlist.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
