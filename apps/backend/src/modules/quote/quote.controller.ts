import { Controller, Post, Body, Param, UseGuards, Get, ForbiddenException } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '@hardware-os/shared';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @Roles(UserRole.MERCHANT)
  submit(@CurrentMerchant() merchantId: string, @Body() dto: SubmitQuoteDto) {
    return this.quoteService.submit(merchantId, dto);
  }

  @Post(':id/accept')
  @Roles(UserRole.BUYER)
  accept(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quoteService.accept(user.sub, id);
  }

  @Post(':id/decline')
  @Roles(UserRole.BUYER)
  decline(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quoteService.decline(user.sub, id);
  }

  @Get('rfq/:rfqId')
  getByRFQ(@Param('rfqId') rfqId: string) {
    return this.quoteService.getByRFQ(rfqId);
  }
}
