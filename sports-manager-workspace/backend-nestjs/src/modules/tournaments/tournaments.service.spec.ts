import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsService } from './tournaments.service';
import { TournamentsRepository } from './tournaments.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { MatchesRepository } from '../matches/matches.repository';

const PILOTO_LEAGUE_ID = '00000000-0000-0000-0000-000000000001';

const mockTournamentsRepo = {
  findBySlug: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findAllGlobal: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

const mockTeamsRepo = { findByTournament: jest.fn() };
const mockMatchesRepo = { bulkCreate: jest.fn() };

const baseDto = {
  name: 'Copa Test',
  sportType: 'FOOTBALL' as const,
  format: 'ROUND_ROBIN' as const,
  halfDurationMinutes: 45,
  maxRosterSize: 15,
};

describe('TournamentsService', () => {
  let service: TournamentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: TournamentsRepository, useValue: mockTournamentsRepo },
        { provide: TeamsRepository, useValue: mockTeamsRepo },
        { provide: MatchesRepository, useValue: mockMatchesRepo },
      ],
    }).compile();

    service = module.get<TournamentsService>(TournamentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('passes decimal fine values to repository', async () => {
      mockTournamentsRepo.findBySlug.mockResolvedValue(null);
      mockTournamentsRepo.create.mockResolvedValue({ id: 'abc', yellowCardFine: 0.5 });

      await service.create({ ...baseDto, yellowCardFine: 0.5 }, PILOTO_LEAGUE_ID);

      expect(mockTournamentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ yellowCardFine: 0.5 }),
      );
    });

    it('includes refereeFeeEnabled in repository payload', async () => {
      mockTournamentsRepo.findBySlug.mockResolvedValue(null);
      mockTournamentsRepo.create.mockResolvedValue({ id: 'abc' });

      await service.create({ ...baseDto, refereeFeeEnabled: false }, PILOTO_LEAGUE_ID);

      expect(mockTournamentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ refereeFeeEnabled: false }),
      );
    });

    it('throws BadRequestException when slug is already taken', async () => {
      mockTournamentsRepo.findBySlug.mockResolvedValue({ id: 'existing' });

      await expect(service.create({ ...baseDto, slug: 'taken' }, PILOTO_LEAGUE_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
