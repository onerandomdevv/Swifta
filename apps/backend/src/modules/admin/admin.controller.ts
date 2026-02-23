import { Controller, Get, Patch, Delete, Param, UseGuards, Body, Req, Query, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, OrderStatus } from '@hardware-os/shared';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getSystemStats() {
    return this.adminService.getPlatformStats();
  }

  @Patch('merchants/:id/verify')
  verifyMerchantProfile(@Param('id') merchantId: string) {
    return this.adminService.verifyMerchant(merchantId);
  }

  @Patch('merchants/:id/reject')
  rejectMerchantProfile(@Param('id') merchantId: string) {
    return this.adminService.rejectMerchant(merchantId);
  }

  @Get('merchants/pending')
  getPendingMerchants() {
    return this.adminService.getPendingMerchants();
  }

  @Get('orders')
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Patch('orders/:id/force-resolve')
  forceResolveOrder(
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
    @Req() req: any,
  ) {
    return this.adminService.forceResolveOrder(orderId, status, req.user.id);
  }

  @Get('products')
  getAllProducts() {
    return this.adminService.getAllProducts();
  }

  @Get('analytics')
  getGlobalAnalytics() {
    return this.adminService.getGlobalAnalytics();
  }

  @Get('alerts')
  getSystemAlerts() {
    return this.adminService.getSystemAlerts();
  }

  @Get('orders/export')
  exportOrders(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.adminService.exportOrders(startDate, endDate);
  }

  @Post('broadcast')
  broadcastMessage(@Body('message') message: string) {
    return this.adminService.broadcastMessage(message);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/promote')
  promoteToAdmin(@Param('id') userId: string, @Req() req: any) {
    return this.adminService.promoteToAdmin(userId, req.user.id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string, @Req() req: any) {
    return this.adminService.deleteUser(userId, req.user.id);
  }

  @Patch('change-password')
  changePassword(
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Req() req: any,
  ) {
    return this.adminService.changePassword(req.user.id, currentPassword, newPassword);
  }
}
