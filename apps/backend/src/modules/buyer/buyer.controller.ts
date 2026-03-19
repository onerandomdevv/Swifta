import { Controller, Get, UseGuards } from "@nestjs/common";
import { BuyerDashboardService } from "./buyer-dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, JwtPayload } from "@swifta/shared";

@Controller("buyer")
export class BuyerController {
  constructor(private readonly dashboardService: BuyerDashboardService) {}

  @Get("dashboard/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  async getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getDashboardStats(user.sub);
  }
}
