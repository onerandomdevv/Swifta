import {
  Controller,
  Get,
  Body,
  Param,
  UseGuards,
  Post,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentMerchant } from "../../common/decorators/current-merchant.decorator";
import { UserRole } from "@swifta/shared";

@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("products/:productId")
  @Roles(UserRole.MERCHANT)
  getHistory(
    @CurrentMerchant() merchantId: string,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.inventoryService.getHistory(
      merchantId,
      productId,
      query.page,
      query.limit,
    );
  }

  @Get("products/:productId/stock")
  @Roles(UserRole.MERCHANT)
  getStockLevel(
    @CurrentMerchant() merchantId: string,
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.inventoryService.getStockLevel(merchantId, productId);
  }

  @Post("products/:productId/adjust")
  @Roles(UserRole.MERCHANT)
  adjustStock(
    @CurrentMerchant() merchantId: string,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.manualAdjustment(
      merchantId,
      productId,
      dto.quantity,
      dto.notes,
    );
  }
}
