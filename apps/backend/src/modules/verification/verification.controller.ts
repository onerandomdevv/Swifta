import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { VerificationService } from "./verification.service";
import {
  SubmitVerificationDto,
  ReviewVerificationDto,
} from "./verification.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@hardware-os/shared";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // ─── MERCHANT ENDPOINTS ──────────────────────────────────────────────────

  @Post("verification/request")
  @Roles(UserRole.MERCHANT)
  submitRequest(@Body() dto: SubmitVerificationDto, @Req() req: any) {
    // req.user.merchantId is attached by MerchantContextMiddleware
    return this.verificationService.submitRequest(req.user.merchantId, dto);
  }

  @Get("verification/status")
  @Roles(UserRole.MERCHANT)
  getStatus(@Req() req: any) {
    return this.verificationService.getStatus(req.user.merchantId);
  }

  // ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────

  @Get("admin/verification/requests")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  getPendingRequests(@Query() query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    return this.verificationService.getPendingRequests(page, limit);
  }

  @Post("admin/verification/requests/:id/review")
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  reviewRequest(
    @Param("id") requestId: string,
    @Body() dto: ReviewVerificationDto,
    @Req() req: any,
  ) {
    return this.verificationService.reviewRequest(
      requestId,
      req.user.sub, // admin user ID
      dto,
    );
  }
}
