import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@swifta/shared";

@Injectable()
export class MerchantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // Extract merchantId directly from JWT payload — no DB query needed.
    // The JWT already contains merchantId if the user is a merchant.
    if (user && user.role === UserRole.MERCHANT && user.merchantId) {
      (req as any).merchantId = user.merchantId;
    }

    next();
  }
}
