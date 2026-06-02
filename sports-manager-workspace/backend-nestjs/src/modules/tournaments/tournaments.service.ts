import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { generateSlug } from '../../shared/utils/slug.util';
import { MatchesRepository } from '../matches/matches.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FixtureFactory } from './fixture/fixture.factory';
import { TournamentsRepository } from './tournaments.repository';

@Injectable()
export class TournamentsService {
  constructor(
    private tournamentsRepository: TournamentsRepository,
    private teamsRepository: TeamsRepository,
    private matchesRepository: MatchesRepository,
  ) {}

  async create(dto: CreateTournamentDto, leagueId: string) {
    const slug = dto.slug ?? generateSlug(dto.name);
    const existing = await this.tournamentsRepository.findBySlug(slug, leagueId);
    if (existing) throw new BadRequestException(`El slug "${slug}" ya está en uso`);

    return this.tournamentsRepository.create({
      name: dto.name,
      slug,
      leagueId,
      sportType: dto.sportType,
      format: dto.format,
      halfDurationMinutes: dto.halfDurationMinutes,
      maxRosterSize: dto.maxRosterSize,
      category: dto.category,
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.logoBgRemovedUrl !== undefined && { logoBgRemovedUrl: dto.logoBgRemovedUrl }),
      ...(dto.yellowCardFine !== undefined && { yellowCardFine: dto.yellowCardFine }),
      ...(dto.redCardFine !== undefined && { redCardFine: dto.redCardFine }),
      ...(dto.lateFine !== undefined && { lateFine: dto.lateFine }),
      ...(dto.courtFee !== undefined && { courtFee: dto.courtFee }),
      ...(dto.refereeFee !== undefined && { refereeFee: dto.refereeFee }),
      ...(dto.refereeFeeEnabled !== undefined && { refereeFeeEnabled: dto.refereeFeeEnabled }),
    });
  }

  findAll(leagueId: string | null) {
    if (leagueId === null) return this.tournamentsRepository.findAllGlobal();
    return this.tournamentsRepository.findAll(leagueId);
  }

  async findById(id: string) {
    const tournament = await this.tournamentsRepository.findById(id);
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    return tournament;
  }

  async findBySlug(slug: string) {
    const tournament = await this.tournamentsRepository.findBySlug(slug);
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    return tournament;
  }

  async update(id: string, data: Partial<CreateTournamentDto>) {
    const tournament = await this.tournamentsRepository.findById(id);
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    return this.tournamentsRepository.update(id, data);
  }

  async generateFixture(tournamentId: string) {
    const tournament = await this.tournamentsRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const teams = await this.teamsRepository.findByTournament(tournamentId);
    if (teams.length < 2) throw new BadRequestException('Se necesitan al menos 2 equipos para generar el fixture');

    const strategy = FixtureFactory.create(tournament.format);
    const fixtureMatches = strategy.generateFixture(
      teams.map((t) => ({ id: t.id, name: t.name })),
      tournamentId,
    );

    const created = await this.matchesRepository.bulkCreate(fixtureMatches);
    await this.tournamentsRepository.update(tournamentId, { status: 'ACTIVE' });

    return { matchesCreated: created.length, matches: created };
  }
}
