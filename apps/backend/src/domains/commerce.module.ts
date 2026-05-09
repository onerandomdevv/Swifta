import { Module } from "@nestjs/common";

import { CartModule } from "../modules/cart/cart.module";
import { CategoryModule } from "../modules/category/category.module";
import { InventoryModule } from "../modules/inventory/inventory.module";
import { LogisticsModule } from "../modules/logistics/logistics.module";
import { OrderModule } from "../modules/order/order.module";
import { ProductModule } from "../modules/product/product.module";
import { ReorderModule } from "../modules/reorder/reorder.module";
import { ReviewModule } from "../modules/review/review.module";
import { WishlistModule } from "../modules/wishlist/wishlist.module";

@Module({
  imports: [
    CategoryModule,
    ProductModule,
    InventoryModule,
    CartModule,
    OrderModule,
    LogisticsModule,
    ReviewModule,
    WishlistModule,
    ReorderModule,
  ],
})
export class CommerceDomainModule {}
