import { Module } from '@nestjs/common';
import { TeamsModule } from '../teams/teams.module';
import { PlayersController } from './players.controller';
import { PlayersRepository } from './players.repository';
import { PlayersService } from './players.service';

@Module({
  imports: [TeamsModule],
  providers: [PlayersService, PlayersRepository],
  controllers: [PlayersController],
})
export class PlayersModule {}
