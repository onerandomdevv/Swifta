import { JwtPayload } from "@twizrr/shared";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      merchantId?: string;
    }
  }
}
