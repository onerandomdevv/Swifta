import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BnplService } from './bnpl.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bnpl')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BnplController {
  constructor(private readonly bnplService: BnplService) {}

  @Get('eligibility')
  @Roles(UserRole.BUYER)
  async getEligibility(@CurrentUser() user: any) {
    const result = await this.bnplService.checkEligibility(user.id);
    return result;
  }

  @Post('waitlist')
  @Roles(UserRole.BUYER)
  async joinWaitlist(
    @CurrentUser() user: any,
    @Body() body: { phone?: string }
  ) {
    // Email is resolved server-side from the auth token — never trust client input
    return this.bnplService.joinWaitlist(user.id, user.email, body.phone);
  }
}
