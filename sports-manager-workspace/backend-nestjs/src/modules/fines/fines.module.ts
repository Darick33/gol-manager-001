import { Module } from '@nestjs/common';
import { BalanceModule } from '../balance/balance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinesController } from './fines.controller';
import { FinesRepository } from './fines.repository';
import { FinesService } from './fines.service';

@Module({
  imports: [NotificationsModule, BalanceModule],
  providers: [FinesService, FinesRepository],
  controllers: [FinesController],
  exports: [FinesService, FinesRepository],
})
export class FinesModule {}
