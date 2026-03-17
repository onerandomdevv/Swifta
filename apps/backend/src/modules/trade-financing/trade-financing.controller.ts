import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { TradeFinancingService } from "./trade-financing.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@swifta/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { ApplyLoanDto } from "./dto/apply-loan.dto";

@Controller("trade-financing")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TradeFinancingController {
  constructor(private readonly financingService: TradeFinancingService) {}

  @Get("eligibility")
  @Roles(UserRole.MERCHANT)
  async getEligibility(@CurrentUser() user: any) {
    return this.financingService.checkEligibility(user.sub);
  }

  @Post("apply")
  @Roles(UserRole.MERCHANT)
  async apply(@CurrentUser() user: any, @Body() body: ApplyLoanDto) {
    return this.financingService.applyForFinancing(
      user.sub,
      body.orderId,
      body.tenureDays,
    );
  }

  @Get("loans")
  @Roles(UserRole.MERCHANT)
  async getLoans(@CurrentUser() user: any) {
    return this.financingService.getMerchantLoans(user.sub);
  }

  @Post("waitlist")
  async joinWaitlist(@CurrentUser() user: any) {
    return this.financingService.joinWaitlist(user.sub);
  }
}
