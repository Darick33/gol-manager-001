import { Module } from '@nestjs/common';
import { FinesModule } from '../fines/fines.module';
import { PaymentsModule } from '../payments/payments.module';
import { PublicModule } from '../public/public.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [PublicModule, FinesModule, PaymentsModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
