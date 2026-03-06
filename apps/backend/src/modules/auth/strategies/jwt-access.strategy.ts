import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtPayload, UserRole } from "@hardware-os/shared";
import { PrismaService } from "../../../prisma/prisma.service";

import { Request } from "express";

const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies && req.cookies["hwos_access_token"]) {
    token = req.cookies["hwos_access_token"];
  }
  // Fallback to Bearer token
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
};

const ADMIN_ROLES: string[] = [
  UserRole.SUPER_ADMIN,
  UserRole.OPERATOR,
  UserRole.SUPPORT,
];

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  "jwt-access",
) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("jwt.accessSecret"),
    });
  }

  async validate(payload: JwtPayload) {
    // For admin/staff roles, verify they're still approved
    if (ADMIN_ROLES.includes(payload.role)) {
      try {
        const adminProfile = await this.prisma.adminProfile.findUnique({
          where: { userId: payload.sub },
          select: { approvalStatus: true },
        });

        if (adminProfile && adminProfile.approvalStatus !== "APPROVED") {
          throw new UnauthorizedException(
            adminProfile.approvalStatus === "SUSPENDED"
              ? "Your account has been suspended."
              : "Your account is awaiting approval.",
          );
        }
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        // Don't crash on DB errors — let the request through (fail open for non-critical check)
      }
    }
    return payload;
  }
}
