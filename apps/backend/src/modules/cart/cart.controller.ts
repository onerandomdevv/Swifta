import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "@twizrr/shared";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub);
  }

  @Post("items")
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddToCartDto) {
    return this.cartService.addItemToCart(user.sub, dto);
  }

  @Patch("items/:id")
  updateItem(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(user.sub, id, dto);
  }

  @Delete("items/:id")
  removeItem(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cartService.removeItemFromCart(user.sub, id);
  }

  @Delete()
  clearCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.clearCart(user.sub);
  }
}
