import { Controller, Get, Patch, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '@hardware-os/shared';

@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    if (!user.merchantId) {
        throw new NotFoundException('Merchant profile not found');
    }
    return this.merchantService.getProfile(user.merchantId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async updateMyProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMerchantDto) {
    if (!user.merchantId) {
        throw new NotFoundException('Merchant profile not found');
    }
    return this.merchantService.updateProfile(user.merchantId, dto);
  }

  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    return this.merchantService.getPublicProfile(id);
  }
}
