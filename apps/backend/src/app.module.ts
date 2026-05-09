import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";

import { CoreModule } from "./core/core.module";
import { QueueModule } from "./queue/queue.module";

import { ChannelsDomainModule } from "./domains/channels.module";
import { CommerceDomainModule } from "./domains/commerce.module";
import { MoneyDomainModule } from "./domains/money.module";
import { UsersTrustDomainModule } from "./domains/users-trust.module";

import { MerchantContextMiddleware } from "./common/middleware/merchant-context.middleware";

@Module({
  imports: [
    CoreModule,
    QueueModule,
    CommerceDomainModule,
    MoneyDomainModule,
    UsersTrustDomainModule,
    ChannelsDomainModule,
  ],

  controllers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MerchantContextMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
