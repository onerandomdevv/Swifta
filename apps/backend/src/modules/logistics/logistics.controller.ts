import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { LogisticsService } from "./logistics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UserRole } from "@hardware-os/shared";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("logistics")
export class LogisticsController {
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
  async handleWebhook(@Body() payload: any, @Req() req: any) {
    // In production, verify LOGISTICS_WEBHOOK_SECRET
    // const signature = req.headers['x-logistics-signature'];
    return this.logisticsService.handlePartnerWebhook(payload);
  }

  @Get("tracking/:orderId")
  @UseGuards(JwtAuthGuard)
  async getTrackingStatus(@Param("orderId") orderId: string, @Req() req: any) {
    // Basic authorization checking
    const userId = req.user.id;
    return this.logisticsService.getTrackingStatus(
      orderId,
      userId,
      req.user.role,
    );
  }
}
