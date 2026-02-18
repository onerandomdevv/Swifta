import { Controller, Get, Post, Body, Param, UseGuards, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RFQService } from './rfq.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { UserRole, JwtPayload } from '@hardware-os/shared';

@Controller('rfqs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RFQController {
  constructor(private readonly rfqService: RFQService) {}

  @Post()
  @Roles(UserRole.BUYER)
  create(@CurrentUser() user: JwtPayload, @Body() createRFQDto: CreateRFQDto) {
    return this.rfqService.create(user.sub, createRFQDto);
  }

  @Get()
  @Roles(UserRole.BUYER)
  findAllMyRFQs(@CurrentUser() user: JwtPayload, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.rfqService.listByBuyer(user.sub, page, limit);
  }

  @Get('merchant')
  @Roles(UserRole.MERCHANT)
  findAllIncomingRFQs(@CurrentMerchant() merchantId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.rfqService.listByMerchant(merchantId, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rfqService.getById(id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BUYER)
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rfqService.cancel(user.sub, id);
  }
}
