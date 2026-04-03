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
  Res,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { InvoiceService } from "./invoice.service";
import { ConfirmDeliveryDto } from "./dto/confirm-delivery.dto";
import type { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentMerchant } from "../../common/decorators/current-merchant.decorator";
import { UserRole, JwtPayload } from "@twizrr/shared";
import { CreateDirectOrderDto } from "./dto/create-direct-order.dto";
import { CreateTrackingDto } from "./dto/create-tracking.dto";
import { CheckoutCartDto } from "./dto/checkout-cart.dto";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly invoiceService: InvoiceService,
  ) {}

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

  @Post("direct")
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
  createDirectOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDirectOrderDto,
  ) {
    return this.orderService.createDirectOrder(user.sub, dto);
  }

  @Post("checkout/cart")
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
  checkoutCart(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutCartDto) {
    return this.orderService.checkoutCart(user.sub, dto);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.orderService.getById(id, user.sub, user.merchantId);
  }

  @Post(":id/tracking")
  @Roles(UserRole.MERCHANT)
  addTracking(
    @CurrentMerchant() merchantId: string | undefined,
    @Param("id") id: string,
    @Body() dto: CreateTrackingDto,
  ) {
    if (!merchantId) {
      throw new ForbiddenException("Merchant identity required");
    }
    return this.orderService.addTracking(merchantId, id, dto);
  }

  @Get(":id/tracking")
  getTracking(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.orderService.getTracking(id, user.sub, user.merchantId);
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
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
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
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
  reportIssue(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    return this.orderService.reportIssue(user.sub, id, reason);
  }

  @Get(":id/receipt")
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
  getReceipt(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.orderService.getReceipt(id, user.sub);
  }

  @Get(":id/invoice")
  @Roles(UserRole.BUYER, UserRole.MERCHANT)
  async getInvoice(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    // Pass caller identity to the service to enforce ownership validation
    return this.invoiceService.generateInvoice(id, res, user);
  }
}
