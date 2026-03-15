import { JwtPayload } from "@swifta/shared";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      merchantId?: string;
    }
  }
}
