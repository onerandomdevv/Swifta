import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";
import { RequestPayoutDto } from "./dto/request-payout.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { WebhookSignatureGuard } from "./webhook-signature.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { IdempotencyKey } from "../../common/decorators/idempotency-key.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, JwtPayload } from "@swifta/shared";

@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("initialize")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  initialize(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitializePaymentDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.paymentService.initialize(user.sub, dto, idempotencyKey);
  }

  @Post("webhook")
  @UseGuards(WebhookSignatureGuard)
  webhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }

  @Get("resolve-account")
  @UseGuards(JwtAuthGuard)
  resolveAccount(
    @Query("accountNumber") accountNumber: string,
    @Query("bankCode") bankCode: string,
  ) {
    return this.paymentService.resolveAccount(accountNumber, bankCode);
  }

  @Get("banks")
  @UseGuards(JwtAuthGuard)
  getBanks() {
    return this.paymentService.getBanks();
  }

  @Get("verify/:reference")
  @UseGuards(JwtAuthGuard)
  verifyPayment(@Param("reference") reference: string) {
    return this.paymentService.verifyPayment(reference);
  }

  @Post("request-payout")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  requestPayout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.paymentService.requestPayout(user.merchantId, dto);
  }
}
