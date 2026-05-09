import { Module, forwardRef } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import {
  JwtModule,
  type JwtModuleOptions,
  type JwtSignOptions,
} from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { InternalAuthController } from "./internal-auth.controller";
import { AuthService } from "./auth.service";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { AdminModule } from "../admin/admin.module";
import { NotificationModule } from "../notification/notification.module";
import { EmailModule } from "../email/email.module";
import { WhatsAppModule } from "../../channels/whatsapp/whatsapp.module";

type JwtExpiresIn = NonNullable<JwtSignOptions["expiresIn"]>;

const jwtTtl = (configService: ConfigService, key: string): JwtExpiresIn =>
  configService.getOrThrow<string>(key) as JwtExpiresIn;

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>("jwt.accessSecret"),
        signOptions: { expiresIn: jwtTtl(configService, "jwt.accessTtl") },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    PrismaModule,
    RedisModule,
    NotificationModule,
    EmailModule,
    forwardRef(() => AdminModule),
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [AuthController, InternalAuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
