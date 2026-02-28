import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        
        return {
          pinoHttp: {
            // Automatically log request and response at info level.
            // Disable this if it gets too noisy, or set a custom log level.
            autoLogging: true,
            transport: isProduction
              ? undefined
              : {
                  // In local development, use pino-pretty for clean, colorized output
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname', // Keep it clean
                  },
                },
            // Customize serializers to remove sensitive headers/data if needed
            serializers: {
              req: (req) => {
                req.body = req.raw.body;
                return req;
              },
            },
            level: isProduction ? 'info' : 'debug',
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
