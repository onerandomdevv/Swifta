import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { DvaService } from "./dva.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, JwtPayload } from "@swifta/shared";

@Controller("buyer/dva")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUYER)
export class DvaController {
  constructor(private readonly dvaService: DvaService) {}

  @Post("create")
  @HttpCode(HttpStatus.CREATED)
  async createDva(@CurrentUser() user: JwtPayload) {
    return this.dvaService.createDva(user.sub);
  }

  @Get()
  async getDva(@CurrentUser() user: JwtPayload) {
    return this.dvaService.getDva(user.sub);
  }
}
