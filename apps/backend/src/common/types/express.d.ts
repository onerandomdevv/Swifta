import { JwtPayload } from '@hardware-os/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      merchantId?: string;
    }
  }
}
