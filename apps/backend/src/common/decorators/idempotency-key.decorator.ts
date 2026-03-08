import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";

export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    let count = 0;
    if (request.rawHeaders) {
      for (let i = 0; i < request.rawHeaders.length; i += 2) {
        if (request.rawHeaders[i].toLowerCase() === "x-idempotency-key") {
          count++;
        }
      }
    }

    if (count > 1) {
      throw new BadRequestException("Duplicate x-idempotency-key header");
    }

    const key = request.headers["x-idempotency-key"];
    return key as string | undefined;
  },
);
