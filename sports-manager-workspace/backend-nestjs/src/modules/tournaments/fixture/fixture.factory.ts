import { BadRequestException } from '@nestjs/common';
import { DirectEliminationFormat } from './direct-elimination.format';
import { GroupsEliminationFormat } from './groups-elimination.format';
import { RoundRobinFormat } from './round-robin.format';
import { TournamentFormatStrategy } from './tournament-format.interface';

export class FixtureFactory {
  static create(format: string): TournamentFormatStrategy {
    switch (format) {
      case 'ROUND_ROBIN':
        return new RoundRobinFormat();
      case 'DIRECT_ELIMINATION':
        return new DirectEliminationFormat();
      case 'GROUPS_ELIMINATION':
        return new GroupsEliminationFormat();
      default:
        throw new BadRequestException(`Formato de torneo no soportado: ${format}`);
    }
  }
}
