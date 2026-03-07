import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "@hardware-os/shared";

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
