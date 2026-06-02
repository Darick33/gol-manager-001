import { BadRequestException } from '@nestjs/common';
import { DirectEliminationFormat } from './direct-elimination.format';
import { GroupsEliminationFormat } from './groups-elimination.format';
import { RoundRobinFormat } from './round-robin.format';
import { TournamentFormatStrategy } from './tournament-format.interface';

type FormatConstructor = () => TournamentFormatStrategy;

const FORMATS: Map<string, FormatConstructor> = new Map([
  ['ROUND_ROBIN', () => new RoundRobinFormat()],
  ['DIRECT_ELIMINATION', () => new DirectEliminationFormat()],
  ['GROUPS_ELIMINATION', () => new GroupsEliminationFormat()],
]);

export class FixtureFactory {
  static create(format: string): TournamentFormatStrategy {
    const factory = FORMATS.get(format);
    if (!factory) throw new BadRequestException(`Formato de torneo no soportado: ${format}`);
    return factory();
  }

  static register(format: string, factory: FormatConstructor): void {
    FORMATS.set(format, factory);
  }
}
