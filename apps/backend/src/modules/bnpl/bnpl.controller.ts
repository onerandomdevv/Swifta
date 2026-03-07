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
    @Body() body: { email: string; phone?: string }
  ) {
    return this.bnplService.joinWaitlist(user.id, body.email, body.phone);
  }
}
