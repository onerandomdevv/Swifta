import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { AdminService } from "../admin/admin.service";
import { LoginDto } from "./dto/login.dto";
import { AdminRegisterDto } from "./dto/admin-register.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("auth/internal")
export class InternalAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
  ) {}

  private setCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("hwos_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("hwos_refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("register")
  async adminRegister(@Body() dto: AdminRegisterDto) {
    return this.authService.adminRegister(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async internalLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.internalLogin(dto);
    this.setCookies(res, result);
    return { user: result.user };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("verify-token")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyStaffToken(@Body("token") token: string, @Req() req: any) {
    return this.adminService.verifyStaffToken(
      req.user.sub,
      req.user.role,
      token,
    );
  }
}
