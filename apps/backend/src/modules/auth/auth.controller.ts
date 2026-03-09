import {
  Controller,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  Req,
} from "@nestjs/common";
import { Response, Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { SendPhoneOtpDto } from "./dto/send-phone-otp.dto";
import { VerifyPhoneOtpDto } from "./dto/verify-phone-otp.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtRefreshGuard } from "../../common/guards/jwt-refresh.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "@hardware-os/shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      path: "/",
    });
    res.cookie("hwos_refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }

  private clearCookies(res: Response) {
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("none" as const) : ("lax" as const),
      path: "/",
    };
    res.clearCookie("hwos_access_token", cookieOptions);
    res.clearCookie("hwos_refresh_token", cookieOptions);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setCookies(res, result);
    return { user: result.user };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setCookies(res, result);
    return { user: result.user };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("send-phone-otp")
  @HttpCode(HttpStatus.OK)
  async sendPhoneOtp(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendPhoneOtpDto,
  ) {
    return this.authService.sendPhoneOtp(dto, user.sub);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("whatsapp/initiate")
  @HttpCode(HttpStatus.OK)
  async initiateWhatsAppLogin(@Body() dto: SendPhoneOtpDto) {
    return this.authService.initiateWhatsAppLogin(dto.phone);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("whatsapp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyWhatsAppLogin(
    @Body() dto: VerifyPhoneOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyWhatsAppLogin(
      dto.phone,
      dto.code,
    );
    this.setCookies(res, result);
    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("verify-phone-otp")
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyPhoneOtpDto,
  ) {
    return this.authService.verifyPhoneOtp(dto, user.sub);
  }

  @Post("refresh")
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: any,
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Prefer HttpOnly cookie first, fallback to DTO body
    const refreshToken =
      req.cookies?.["hwos_refresh_token"] || dto.refreshToken;
    const result = await this.authService.refreshTokens(user.sub, refreshToken);
    this.setCookies(res, result);
    return { success: true };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(user.sub);
    this.clearCookies(res);
    return result;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: JwtPayload) {
    const freshUser = await this.authService.getInternalMe(user.sub);
    return { user: freshUser };
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 per hour limit
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 per hour limit
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.authService.changePassword(user.sub, dto);
  }
}
