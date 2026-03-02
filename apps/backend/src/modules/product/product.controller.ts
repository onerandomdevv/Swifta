import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
} from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CatalogueQueryDto } from "./dto/catalogue-query.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentMerchant } from "../../common/decorators/current-merchant.decorator";
import { UserRole } from "@hardware-os/shared";

@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  create(@CurrentMerchant() merchantId: string, @Body() dto: CreateProductDto) {
    return this.productService.create(merchantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  findAllMyProducts(
    @CurrentMerchant() merchantId: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
  ) {
    return this.productService.listByMerchant(merchantId, +page, +limit);
  }

  @Get("merchant/:merchantId")
  @UseInterceptors(CacheInterceptor)
  findAllByMerchant(
    @Param("merchantId", ParseUUIDPipe) merchantId: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
  ) {
    return this.productService.listPublicByMerchant(merchantId, +page, +limit);
  }

  @Get("associations")
  @UseInterceptors(CacheInterceptor)
  getAssociations(@Query("category") category: string) {
    return this.productService.getAssociations(category);
  }

  @Get("catalogue")
  @UseInterceptors(CacheInterceptor)
  findAllCatalogue(@Query() query: CatalogueQueryDto) {
    return this.productService.catalogue(query.search, query.page, query.limit);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.productService.getById(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  update(
    @CurrentMerchant() merchantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(merchantId, id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  remove(
    @CurrentMerchant() merchantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.productService.softDelete(merchantId, id);
  }

  @Post(":id/restore")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  restore(
    @CurrentMerchant() merchantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.productService.restore(merchantId, id);
  }
}
