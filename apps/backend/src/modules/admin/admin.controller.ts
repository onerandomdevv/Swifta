import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Body,
  Req,
  Query,
  Post,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, OrderStatus } from "@swifta/shared";
import { IsEnum, IsString, IsNotEmpty, IsBoolean, IsIn } from "class-validator";

export class CreateAccessTokenDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ToggleMerchantFlagDto {
  @IsIn(["cacVerified", "addressVerified", "bankVerified"])
  flag: "cacVerified" | "addressVerified" | "bankVerified";

  @IsBoolean()
  value: boolean;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.SUPPORT)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  @Roles(UserRole.SUPER_ADMIN)
  getSystemStats() {
    return this.adminService.getPlatformStats();
  }

  @Patch("merchants/:id/verify")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  verifyMerchantProfile(@Param("id") merchantId: string, @Req() req: any) {
    return this.adminService.verifyMerchant(merchantId, req.user.sub);
  }

  @Patch("merchants/:id/reject")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  rejectMerchantProfile(@Param("id") merchantId: string, @Req() req: any) {
    return this.adminService.rejectMerchant(
      merchantId,
      undefined,
      req.user.sub,
    );
  }

  @Patch("merchants/:id/flags")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  toggleMerchantFlag(
    @Param("id") merchantId: string,
    @Body() dto: ToggleMerchantFlagDto,
    @Req() req: any,
  ) {
    return this.adminService.toggleMerchantFlag(
      merchantId,
      dto.flag,
      dto.value,
      req.user.sub,
    );
  }

  @Get("merchants/pending")
  getPendingMerchants() {
    return this.adminService.getPendingMerchants();
  }

  @Get("orders")
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Patch("orders/:id/force-resolve")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  forceResolveOrder(
    @Param("id") orderId: string,
    @Body("status") status: OrderStatus,
    @Req() req: any,
  ) {
    return this.adminService.forceResolveOrder(orderId, status, req.user.sub);
  }

  @Get("products")
  getAllProducts() {
    return this.adminService.getAllProducts();
  }

  @Get("analytics")
  @Roles(UserRole.SUPER_ADMIN)
  getGlobalAnalytics() {
    return this.adminService.getGlobalAnalytics();
  }

  @Get("alerts")
  getSystemAlerts() {
    return this.adminService.getSystemAlerts();
  }

  @Get("orders/export")
  exportOrders(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.adminService.exportOrders(startDate, endDate);
  }

  @Post("broadcast")
  @Roles(UserRole.SUPER_ADMIN)
  broadcastMessage(@Body("message") message: string) {
    return this.adminService.broadcastMessage(message);
  }

  @Delete("products/:id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  deleteProduct(@Param("id") productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  @Get("users")
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch("users/:id/promote")
  @Roles(UserRole.SUPER_ADMIN)
  promoteToAdmin(
    @Param("id") userId: string,
    @Body("role") role: UserRole,
    @Req() req: any,
  ) {
    return this.adminService.promoteToAdmin(userId, role, req.user.sub);
  }
  @Get("users/pending")
  @Roles(UserRole.SUPER_ADMIN)
  getPendingStaff() {
    return this.adminService.getPendingStaff();
  }

  @Patch("staff/:id/approve")
  @Roles(UserRole.SUPER_ADMIN)
  approveStaff(@Param("id") staffId: string, @Req() req: any) {
    return this.adminService.approveStaff(staffId, req.user.sub);
  }

  @Delete("users/:id")
  @Roles(UserRole.SUPER_ADMIN)
  deleteUser(@Param("id") userId: string, @Req() req: any) {
    return this.adminService.deleteUser(userId, req.user.sub);
  }

  @Patch("staff/:id/suspend")
  @Roles(UserRole.SUPER_ADMIN)
  suspendStaff(@Param("id") staffId: string, @Req() req: any) {
    return this.adminService.suspendStaff(staffId, req.user.sub);
  }

  @Patch("staff/:id/reactivate")
  @Roles(UserRole.SUPER_ADMIN)
  reactivateStaff(@Param("id") staffId: string, @Req() req: any) {
    return this.adminService.reactivateStaff(staffId, req.user.sub);
  }

  @Patch("change-password")
  changePassword(
    @Body("currentPassword") currentPassword: string,
    @Body("newPassword") newPassword: string,
    @Req() req: any,
  ) {
    return this.adminService.changePassword(
      req.user.sub,
      currentPassword,
      newPassword,
    );
  }

  // ─── Payout Management ───

  @Get("payouts")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  getPendingPayouts() {
    return this.adminService.getPendingPayouts();
  }

  @Patch("payouts/:id/process")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  processPayout(@Param("id") payoutId: string, @Req() req: any) {
    return this.adminService.processPayout(payoutId, req.user.sub);
  }

  // ─── Staff Access Token Management ───

  @Get("access-tokens")
  @Roles(UserRole.SUPER_ADMIN)
  getAccessTokens() {
    return this.adminService.getAccessTokens();
  }

  @Post("access-tokens")
  @Roles(UserRole.SUPER_ADMIN)
  createAccessToken(@Body() dto: CreateAccessTokenDto, @Req() req: any) {
    return this.adminService.createAccessToken(
      dto.role,
      dto.token,
      req.user.sub,
    );
  }

  @Delete("access-tokens/:id")
  @Roles(UserRole.SUPER_ADMIN)
  revokeAccessToken(@Param("id") tokenId: string, @Req() req: any) {
    return this.adminService.revokeAccessToken(tokenId, req.user.sub);
  }

  // ─── Supplier Management (E: Admin creates supplier accounts) ───

  @Post("suppliers/create")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async createSupplierAccount(
    @Body()
    dto: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
      companyName: string;
      companyAddress: string;
      cacNumber?: string;
    },
    @Req() req: any,
  ) {
    return this.adminService.createSupplierAccount(dto, req.user.sub);
  }

  @Get("suppliers")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  listSuppliers(@Query("verified") verified?: string) {
    const isVerified =
      verified === "true" ? true : verified === "false" ? false : undefined;
    return this.adminService.listSuppliers(isVerified);
  }

  @Patch("suppliers/:id/verify")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  verifySupplier(@Param("id") supplierId: string, @Req() req: any) {
    return this.adminService.verifySupplier(supplierId, req.user.sub);
  }
}
