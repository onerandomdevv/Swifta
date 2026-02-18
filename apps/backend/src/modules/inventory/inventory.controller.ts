import { Controller, Get, Body, Param, UseGuards, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { UserRole } from '@hardware-os/shared';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products/:productId')
  @Roles(UserRole.MERCHANT)
  getHistory(@CurrentMerchant() merchantId: string, @Param('productId') productId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.inventoryService.getHistory(merchantId, productId, page, limit);
  }

  @Post('products/:productId/adjust')
  @Roles(UserRole.MERCHANT)
  adjustStock(@CurrentMerchant() merchantId: string, @Param('productId') productId: string, @Body() dto: UpdateStockDto) {
    return this.inventoryService.manualAdjustment(merchantId, productId, dto.quantity, dto.notes);
  }
}
