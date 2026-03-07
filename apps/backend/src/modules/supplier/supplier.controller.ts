import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Param,
} from "@nestjs/common";
import { SupplierService } from "./supplier.service";
import { CreateSupplierProductDto } from "./dto/create-supplier-product.dto";
import { UpdateSupplierProductDto } from "./dto/update-supplier-product.dto";
import { CreateWholesaleOrderDto } from "./dto/create-wholesale-order.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@hardware-os/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("supplier")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get("profile")
  @Roles(UserRole.SUPPLIER)
  getProfile(@CurrentUser("id") userId: string) {
    return this.supplierService.getProfile(userId);
  }

  @Post("products")
  @Roles(UserRole.SUPPLIER)
  createProduct(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSupplierProductDto,
  ) {
    return this.supplierService.createProduct(userId, dto);
  }

  @Get("products")
  @Roles(UserRole.SUPPLIER)
  getMyProducts(@CurrentUser("id") userId: string) {
    return this.supplierService.getMyProducts(userId);
  }

  @Put("products/:id")
  @Roles(UserRole.SUPPLIER)
  updateProduct(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateSupplierProductDto,
  ) {
    return this.supplierService.updateProduct(userId, id, dto);
  }

  @Get("catalogue")
  @Roles(UserRole.MERCHANT, UserRole.SUPER_ADMIN)
  getCatalogue() {
    return this.supplierService.listCatalogue();
  }

  @Get("dashboard")
  @Roles(UserRole.SUPPLIER)
  getDashboard(@CurrentUser("sub") userId: string) {
    return this.supplierService.getDashboardStats(userId);
  }

  @Post("orders")
  @Roles(UserRole.MERCHANT)
  createWholesaleOrder(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateWholesaleOrderDto,
  ) {
    return this.supplierService.createOrder(userId, dto);
  }
}
