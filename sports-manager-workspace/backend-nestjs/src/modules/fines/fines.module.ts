import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinesController } from './fines.controller';
import { FinesRepository } from './fines.repository';
import { FinesService } from './fines.service';

@Module({
  imports: [NotificationsModule],
  providers: [FinesService, FinesRepository],
  controllers: [FinesController],
  exports: [FinesService, FinesRepository],
})
export class FinesModule {}
