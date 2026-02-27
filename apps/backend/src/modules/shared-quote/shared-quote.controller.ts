import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SharedQuoteService } from './shared-quote.service';
import { CreateSharedQuoteDto } from './dto/create-shared-quote.dto';
import { UpdateSharedQuoteDto } from './dto/update-shared-quote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { UserRole } from '@hardware-os/shared';

@Controller('quotes/shared')
export class SharedQuoteController {
  constructor(private readonly sharedQuoteService: SharedQuoteService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  create(
    @CurrentMerchant() merchantId: string,
    @Body() dto: CreateSharedQuoteDto,
  ) {
    return this.sharedQuoteService.create(merchantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  list(
    @CurrentMerchant() merchantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.sharedQuoteService.listByMerchant(merchantId, +page, +limit, status);
  }

  @Get(':slug/public')
  getPublic(@Param('slug') slug: string) {
    return this.sharedQuoteService.getPublicBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  update(
    @CurrentMerchant() merchantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSharedQuoteDto,
  ) {
    return this.sharedQuoteService.update(merchantId, id, dto);
  }
}
