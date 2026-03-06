import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { MerchantService } from "./merchant.service";
import { UpdateMerchantDto } from "./dto/update-merchant.dto";
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentMerchant } from "../../common/decorators/current-merchant.decorator";
import { UserRole } from "@hardware-os/shared";

@Controller("merchants")
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async getMyProfile(@CurrentMerchant() merchantId: string) {
    return this.merchantService.getProfile(merchantId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async updateMyProfile(
    @CurrentMerchant() merchantId: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.merchantService.updateProfile(merchantId, dto);
  }

  @Get()
  async getAllMerchants() {
    return this.merchantService.getAllMerchants();
  }

  @Get(":id")
  async getPublicProfile(@Param("id", ParseUUIDPipe) id: string) {
    return this.merchantService.getPublicProfile(id);
  }

  @Get("bank/resolve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async resolveBank(
    @Query("accountNumber") accountNumber: string,
    @Query("bankCode") bankCode: string,
  ) {
    return this.merchantService.resolveBankAccount(accountNumber, bankCode);
  }

  @Patch("bank-account")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async updateBankAccount(
    @CurrentMerchant() merchantId: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.merchantService.updateBankAccount(merchantId, dto);
  }

  @Get("banks/list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async getBanks() {
    return this.merchantService.getBanks();
  }

  @Post("me/submit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  async submitVerification(@CurrentMerchant() merchantId: string) {
    return this.merchantService.submitForVerification(merchantId);
  }
}
