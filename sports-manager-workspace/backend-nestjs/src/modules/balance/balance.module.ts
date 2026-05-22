import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceRepository } from './balance.repository';
import { BalanceService } from './balance.service';

@Module({
  providers: [BalanceService, BalanceRepository],
  controllers: [BalanceController],
  exports: [BalanceService],
})
export class BalanceModule {}
