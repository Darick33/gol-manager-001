import { Module } from '@nestjs/common';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';
import { RoundsRepository } from './rounds.repository';

@Module({
  controllers: [RoundsController],
  providers: [RoundsService, RoundsRepository],
  exports: [RoundsService],
})
export class RoundsModule {}
