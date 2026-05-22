import { Module } from '@nestjs/common';
import { BalanceModule } from '../balance/balance.module';
import { FinesModule } from '../fines/fines.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  imports: [FinesModule, NotificationsModule, BalanceModule],
  providers: [PaymentsService, PaymentsRepository],
  controllers: [PaymentsController],
  exports: [PaymentsRepository, PaymentsService],
})
export class PaymentsModule {}
