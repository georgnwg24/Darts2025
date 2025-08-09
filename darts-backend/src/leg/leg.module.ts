import { Module } from '@nestjs/common';
import { LegService } from './leg.service';
import { LegController } from './leg.controller';

@Module({
  providers: [LegService],
  controllers: [LegController]
})
export class LegModule {}
