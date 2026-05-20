import { Module } from '@nestjs/common';
import { FinesModule } from '../fines/fines.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  imports: [FinesModule, NotificationsModule],
  providers: [PaymentsService, PaymentsRepository],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
