import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { BnplService } from "./bnpl.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("bnpl")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BnplController {
  constructor(private readonly bnplService: BnplService) {}

  @Get("eligibility")
  @Roles(UserRole.BUYER)
  async getEligibility(@CurrentUser() user: any) {
    const result = await this.bnplService.checkEligibility(user.sub);
    return result;
  }

  @Post("apply")
  @Roles(UserRole.BUYER)
  async applyForLoan(
    @CurrentUser() user: any,
    @Body() body: { orderId: string; tenureDays: number },
  ) {
    return this.bnplService.applyForLoan(
      user.sub,
      body.orderId,
      body.tenureDays,
    );
  }

  @Get("loans")
  @Roles(UserRole.BUYER)
  async getLoans(@CurrentUser() user: any) {
    return this.bnplService.getBuyerLoans(user.sub);
  }

  @Post("waitlist")
  @Roles(UserRole.BUYER)
  async joinWaitlist(
    @CurrentUser() user: any,
    @Body() body: { phone?: string },
  ) {
    // Kept for backward compatibility if older clients still use it
    // Waitlist logic exists in service
    return this.bnplService.joinWaitlist(user.sub, user.email, body.phone);
  }
}
