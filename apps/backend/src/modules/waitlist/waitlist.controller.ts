import { Controller, Post, Body, Get, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { WaitlistService } from "./waitlist.service";
import { CreateWaitlistDto } from "./dto/create-waitlist.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@twizrr/shared";

@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per IP per hour
  @Post()
  async create(@Body() createWaitlistDto: CreateWaitlistDto) {
    const data = await this.waitlistService.create(createWaitlistDto);
    return {
      success: true,
      data,
      message:
        "You have been successfully added to the twizrr merchant waitlist!",
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async findAll() {
    const data = await this.waitlistService.findAll();
    return {
      success: true,
      data,
    };
  }
}
