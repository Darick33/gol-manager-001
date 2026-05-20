import { Module, forwardRef } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsRepository } from './tournaments.repository';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [TeamsModule, forwardRef(() => MatchesModule)],
  providers: [TournamentsService, TournamentsRepository],
  controllers: [TournamentsController],
  exports: [TournamentsRepository, TournamentsService],
})
export class TournamentsModule {}
