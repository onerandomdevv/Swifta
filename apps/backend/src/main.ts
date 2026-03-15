// BigInt JSON serialization polyfill — required for Prisma BigInt columns
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Logger } from "nestjs-pino";
import { Logger as NestLogger } from "@nestjs/common";
import { AppValidationPipe } from "./common/pipes/validation.pipe";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // Required for Paystack webhook HMAC verification
  });

  app.useLogger(app.get(Logger));

  // Global validation pipe (whitelist + transform + formatted errors)
  app.useGlobalPipes(new AppValidationPipe());

  // Global exception filter (formats all errors including Prisma)
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    app.use(helmet());
  } else {
    // Disable some helmet features in dev that might block local browser requests
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: false,
      }),
    );
  }

  app.use(cookieParser());

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

  app.enableCors({
    origin: isDev ? true : origins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization, X-Requested-With",
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");
  NestLogger.log(`Application is running on: ${await app.getUrl()}`);
  if (isDev) {
    NestLogger.log(`CORS enabled for: ${origins.join(", ")} (or TRUE in dev)`);
  }
}
bootstrap();
