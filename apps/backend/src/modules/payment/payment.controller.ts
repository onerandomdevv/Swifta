import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WebhookSignatureGuard } from './webhook-signature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '@hardware-os/shared';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  initialize(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitializePaymentDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.paymentService.initialize(user.sub, dto, idempotencyKey);
  }

  @Post('webhook')
  @UseGuards(WebhookSignatureGuard)
  webhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }
}
