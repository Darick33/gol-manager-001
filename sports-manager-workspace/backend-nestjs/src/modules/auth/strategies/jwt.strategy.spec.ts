import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';

// Minimal mock of dependencies
const MOCK_LEAGUE_ID = 'league-uuid-from-db';

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  role: 'SUPER_ADMIN',
  leagueId: MOCK_LEAGUE_ID,
  name: 'Test User',
  whatsappNumber: null,
  passwordHash: 'hashed',
  createdAt: new Date(),
};

const mockUsersRepo = {
  findById: jest.fn().mockResolvedValue(mockUser),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

// We test validate() directly without running the full Passport strategy
describe('JwtStrategy.validate — grace window', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsersRepo.findById.mockResolvedValue(mockUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    strategy = new JwtStrategy(mockConfig as any, mockUsersRepo as any);
  });

  it('uses leagueId from JWT payload when present', async () => {
    const payload: JwtPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      leagueId: 'payload-league-id',
    };
    const result = await strategy.validate(payload);
    expect(result.leagueId).toBe('payload-league-id');
  });

  it('uses leagueId from DB when payload.leagueId is undefined (legacy token)', async () => {
    // Legacy token: leagueId field is absent from payload
    const payload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      // No leagueId property at all
    } as JwtPayload;
    const result = await strategy.validate(payload);
    expect(result.leagueId).toBe(MOCK_LEAGUE_ID);
  });

  it('resolves to null when payload.leagueId is explicitly null (PLATFORM_ADMIN)', async () => {
    const payload: JwtPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: 'PLATFORM_ADMIN',
      leagueId: null,
    };
    const result = await strategy.validate(payload);
    expect(result.leagueId).toBeNull();
  });

  it('throws UnauthorizedException when user is not found', async () => {
    mockUsersRepo.findById.mockResolvedValueOnce(null);
    const payload: JwtPayload = {
      sub: 'nonexistent-id',
      email: 'ghost@example.com',
      role: 'SUPER_ADMIN',
      leagueId: null,
    };
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
