import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { MerchantVerifiedGuard } from '../../common/guards/merchant-verified.guard';
import { UserRole } from '@hardware-os/shared';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, MerchantVerifiedGuard)
  @Roles(UserRole.MERCHANT)
  create(@CurrentMerchant() merchantId: string, @Body() createProductDto: CreateProductDto) {
    return this.productService.create(merchantId, createProductDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  findAllMyProducts(@CurrentMerchant() merchantId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.productService.listByMerchant(merchantId, page, limit);
  }

  @Get('catalogue')
  findAllCatalogue(@Query('search') search: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.productService.catalogue(search, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.getById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  update(@CurrentMerchant() merchantId: string, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(merchantId, id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  remove(@CurrentMerchant() merchantId: string, @Param('id') id: string) {
    return this.productService.softDelete(merchantId, id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  restore(@CurrentMerchant() merchantId: string, @Param('id') id: string) {
    return this.productService.restore(merchantId, id);
  }
}
