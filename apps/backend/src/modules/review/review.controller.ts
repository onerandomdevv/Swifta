import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { ReviewService } from "./review.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { OrderService } from "../order/order.service";
import { JwtPayload } from "@hardware-os/shared";

@Controller("reviews")
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(userId, dto);
  }

  @Get("merchant/:merchantId")
  async findByMerchant(
    @Param("merchantId") merchantId: string,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.reviewService.findByMerchant(merchantId, page, limit);
  }

  @Get("order/:orderId")
  @UseGuards(JwtAuthGuard)
  async findByOrder(
    @CurrentUser() user: JwtPayload,
    @Param("orderId") orderId: string,
  ) {
    // Verify participation via OrderService
    await this.orderService.getById(orderId, user.sub, user.merchantId);
    return this.reviewService.findByOrder(orderId);
  }
}
