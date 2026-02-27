import { Module } from '@nestjs/common';
import { SharedQuoteService } from './shared-quote.service';
import { SharedQuoteController } from './shared-quote.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SharedQuoteController],
  providers: [SharedQuoteService],
  exports: [SharedQuoteService],
})
export class SharedQuoteModule {}
