import { Controller, Post, Get, Param, UseGuards } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("wishlist")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * Toggle a product in the user's wishlist.
   * POST /wishlist/toggle/:productId
   */
  @Post("toggle/:productId")
  async toggle(
    @CurrentUser("id") userId: string,
    @Param("productId") productId: string,
  ) {
    return this.wishlistService.toggle(userId, productId);
  }

  /**
   * Get all saved products for the authenticated user.
   * GET /wishlist
   */
  @Get()
  async findAll(@CurrentUser("id") userId: string) {
    return this.wishlistService.findAll(userId);
  }

  /**
   * Check if a specific product is saved.
   * GET /wishlist/check/:productId
   */
  @Get("check/:productId")
  async isSaved(
    @CurrentUser("id") userId: string,
    @Param("productId") productId: string,
  ) {
    return this.wishlistService.isSaved(userId, productId);
  }

  /**
   * Get all saved product IDs (bulk check for the feed).
   * GET /wishlist/ids
   */
  @Get("ids")
  async getSavedIds(@CurrentUser("id") userId: string) {
    return this.wishlistService.getSavedIds(userId);
  }
}
