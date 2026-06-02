import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BalanceModule } from '../balance/balance.module';
import { FinesModule } from '../fines/fines.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PdfModule } from '../pdf/pdf.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { UsersModule } from '../users/users.module';
import { MatchEventsRepository } from './match-events.repository';
import { MatchOrchestrationService } from './match-orchestration.service';
import { MatchesController } from './matches.controller';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';
import { MatchTimerService } from './vocalia/match-timer.service';
import { VocaliaGateway } from './vocalia/vocalia.gateway';

@Module({
  imports: [AuthModule, TeamsModule, UsersModule, FinesModule, PdfModule, NotificationsModule, PaymentsModule, BalanceModule, forwardRef(() => TournamentsModule)],
  providers: [MatchesRepository, MatchEventsRepository, MatchTimerService, VocaliaGateway, MatchOrchestrationService, MatchesService],
  controllers: [MatchesController],
  exports: [MatchesRepository, MatchEventsRepository],
})
export class MatchesModule {}
