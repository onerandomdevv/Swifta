import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentMerchant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.merchantId;
  },
);
