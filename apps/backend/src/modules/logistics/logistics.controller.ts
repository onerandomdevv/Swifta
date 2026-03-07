import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
  RawBodyRequest,
  Logger,
} from "@nestjs/common";
import * as crypto from "crypto";
import { LogisticsService } from "./logistics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UserRole } from "@hardware-os/shared";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

@Controller("logistics")
export class LogisticsController {
  private readonly logger = new Logger(LogisticsController.name);

  constructor(private readonly logisticsService: LogisticsService) {}

  @Post("quote")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
  async getQuote(
    @Body()
    dto: {
      pickupAddress: string;
      deliveryAddress: string;
      weightKg?: number;
    },
  ) {
    return this.logisticsService.getQuote(
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.weightKg,
    );
  }

  // Internal endpoint usually triggered by queues, but could be exposed for Admins to retry
  @Post("book")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async bookPickup(@Body() dto: { orderId: string }) {
    return this.logisticsService.bookPickup(dto.orderId);
  }

  @Post("webhook")
  async handleWebhook(@Body() payload: any, @Req() req: RawBodyRequest<any>) {
    const secret = process.env.LOGISTICS_WEBHOOK_SECRET;
    const signature = req.headers["x-logistics-signature"] as string;
    const timestamp = req.headers["x-logistics-timestamp"] as string;

    // 1. Validate timestamp to prevent replay attacks
    if (timestamp) {
      const ts = parseInt(timestamp, 10);
      if (isNaN(ts) || Date.now() - ts > REPLAY_WINDOW_MS) {
        this.logger.warn(
          "Webhook rejected: timestamp out of window or invalid",
        );
        throw new UnauthorizedException(
          "Request timestamp is expired or invalid",
        );
      }
    }

    // 2. Verify HMAC signature if secret is configured
    if (secret) {
      if (!signature) {
        this.logger.warn(
          "Webhook rejected: missing x-logistics-signature header",
        );
        throw new UnauthorizedException("Missing webhook signature");
      }

      const rawBody = req.rawBody
        ? req.rawBody.toString("utf8")
        : JSON.stringify(payload);

      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        this.logger.warn("Webhook rejected: HMAC signature mismatch");
        throw new UnauthorizedException("Invalid webhook signature");
      }
    } else {
      this.logger.warn(
        "LOGISTICS_WEBHOOK_SECRET not set — skipping signature verification (NOT safe for production!)",
      );
    }

    return this.logisticsService.handlePartnerWebhook(payload);
  }

  @Get("tracking/:orderId")
  @UseGuards(JwtAuthGuard)
  async getTrackingStatus(@Param("orderId") orderId: string, @Req() req: any) {
    // Basic authorization checking
    const userId = req.user.sub;
    return this.logisticsService.getTrackingStatus(
      orderId,
      userId,
      req.user.role,
    );
  }
}
