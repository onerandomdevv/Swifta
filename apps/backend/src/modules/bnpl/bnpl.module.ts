import { Module } from '@nestjs/common';
import { BnplController } from './bnpl.controller';
import { BnplService } from './bnpl.service';

@Module({
  controllers: [BnplController],
  providers: [BnplService],
  exports: [BnplService],
})
export class BnplModule {}
