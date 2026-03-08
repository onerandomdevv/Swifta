import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RFQService } from "./rfq.service";
import { CreateRFQDto } from "./dto/create-rfq.dto";
import { UpdateRFQDto } from "./dto/update-rfq.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentMerchant } from "../../common/decorators/current-merchant.decorator";
import { UserRole, JwtPayload } from "@hardware-os/shared";

@Controller("rfqs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RFQController {
  constructor(private readonly rfqService: RFQService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @Roles(UserRole.BUYER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRFQDto) {
    return this.rfqService.create(user.sub, dto);
  }

  @Get()
  @Roles(UserRole.BUYER)
  findAllMyRFQs(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.rfqService.listByBuyer(user.sub, query.page, query.limit);
  }

  @Get("merchant")
  @Roles(UserRole.MERCHANT)
  findAllIncomingRFQs(
    @CurrentMerchant() merchantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.rfqService.listByMerchant(merchantId, query.page, query.limit);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @CurrentMerchant() merchantId: string,
  ) {
    return this.rfqService.getById(id, user.sub, merchantId);
  }

  @Post(":id/cancel")
  @Roles(UserRole.BUYER)
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.rfqService.cancel(user.sub, id);
  }

  @Patch(":id")
  @Roles(UserRole.BUYER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRFQDto,
  ) {
    return this.rfqService.update(user.sub, id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.BUYER)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.rfqService.delete(user.sub, id);
  }
}
