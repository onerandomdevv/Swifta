import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";

export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const key = request.headers["x-idempotency-key"];
    if (Array.isArray(key)) {
      throw new BadRequestException("Duplicate x-idempotency-key header");
    }
    return key;
  },
);
