import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
  ParseIntPipe,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { ConfirmDeliveryDto } from "./dto/confirm-delivery.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentMerchant } from "../../common/decorators/current-merchant.decorator";
import { UserRole, JwtPayload } from "@hardware-os/shared";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    if (user.role === UserRole.MERCHANT && user.merchantId) {
      return this.orderService.listByMerchant(user.merchantId, page, limit);
    }
    return this.orderService.listByBuyer(user.sub, page, limit);
  }

  @Get("summary")
  @Roles(UserRole.MERCHANT)
  getSummary(@CurrentMerchant() merchantId: string | undefined) {
    if (!merchantId) {
      throw new ForbiddenException("Merchant identity required");
    }
    return this.orderService.getMerchantSummary(merchantId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.orderService.getById(id, user.sub, user.merchantId);
  }

  @Post(":id/dispatch")
  @Roles(UserRole.MERCHANT)
  dispatch(
    @CurrentMerchant() merchantId: string | undefined,
    @Param("id") id: string,
  ) {
    if (!merchantId) {
      throw new ForbiddenException("Merchant identity required");
    }
    return this.orderService.dispatch(merchantId, id);
  }

  @Post(":id/confirm-delivery")
  @Roles(UserRole.BUYER)
  confirmDelivery(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: ConfirmDeliveryDto,
  ) {
    return this.orderService.confirmDelivery(user.sub, id, dto.otp);
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.orderService.cancel(user.sub, id, user.merchantId);
  }

  @Post(":id/report-issue")
  @Roles(UserRole.BUYER)
  reportIssue(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    return this.orderService.reportIssue(user.sub, id, reason);
  }

  @Get(":id/receipt")
  @Roles(UserRole.BUYER)
  getReceipt(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.orderService.getReceipt(id, user.sub);
  }
}
