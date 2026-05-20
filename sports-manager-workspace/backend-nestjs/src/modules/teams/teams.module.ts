import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';

@Module({
  providers: [TeamsService, TeamsRepository],
  controllers: [TeamsController],
  exports: [TeamsRepository],
})
export class TeamsModule {}
