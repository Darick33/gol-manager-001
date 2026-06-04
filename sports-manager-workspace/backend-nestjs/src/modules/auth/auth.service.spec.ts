import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

const MOCK_LEAGUE_ACTIVE = { id: 'league-uuid', status: 'ACTIVE' };
const MOCK_LEAGUE_SUSPENDED = { id: 'league-uuid', status: 'SUSPENDED' };

const mockUser = {
  id: 'user-uuid',
  email: 'player@example.com',
  name: 'Player One',
  role: 'SUPER_ADMIN',
  leagueId: 'league-uuid',
  passwordHash: 'hashed',
};

const mockPlatformAdmin = {
  id: 'admin-uuid',
  email: 'admin@example.com',
  name: 'Platform Admin',
  role: 'PLATFORM_ADMIN',
  leagueId: null,
  passwordHash: 'hashed',
};

function makeService({
  user = mockUser as typeof mockUser | typeof mockPlatformAdmin,
  league = MOCK_LEAGUE_ACTIVE as { id: string; status: string } | null,
  jwtVerifyResult = null as Record<string, unknown> | null,
  redisGetdel = null as string | null,
  findByIdUser = mockUser as typeof mockUser | typeof mockPlatformAdmin,
} = {}) {
  const usersRepo = {
    findByEmail: jest.fn().mockResolvedValue(user),
    findById: jest.fn().mockResolvedValue(findByIdUser),
  };

  const leaguesRepo = {
    findById: jest.fn().mockResolvedValue(league),
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn().mockImplementation(() => {
      if (jwtVerifyResult === null) throw new Error('invalid');
      return jwtVerifyResult;
    }),
  };

  const redis = {
    getdel: jest.fn().mockResolvedValue(redisGetdel),
  };

  const service = new AuthService(
    usersRepo as never,
    leaguesRepo as never,
    jwtService as never,
    redis as never,
  );

  return { service, usersRepo, leaguesRepo, jwtService, redis };
}

describe('AuthService.login', () => {
  it('throws UnauthorizedException when user not found', async () => {
    const { service, usersRepo } = makeService();
    usersRepo.findByEmail.mockResolvedValueOnce(null);

    await expect(service.login({ email: 'x@x.com', password: 'pw' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when user league is SUSPENDED', async () => {
    const { service } = makeService({ league: MOCK_LEAGUE_SUSPENDED });

    await expect(
      service.login({ email: mockUser.email, password: 'pw' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows login when league is ACTIVE', async () => {
    const { service } = makeService({ league: MOCK_LEAGUE_ACTIVE });

    const result = await service.login({ email: mockUser.email, password: 'pw' });

    expect(result).toHaveProperty('access_token');
    expect(result.user.role).toBe(mockUser.role);
  });

  it('allows PLATFORM_ADMIN login without checking leagues', async () => {
    const { service, leaguesRepo } = makeService({ user: mockPlatformAdmin });

    const result = await service.login({ email: mockPlatformAdmin.email, password: 'pw' });

    expect(result).toHaveProperty('access_token');
    expect(leaguesRepo.findById).not.toHaveBeenCalled();
  });
});

describe('AuthService.exchangeHandshake', () => {
  it('should exchange a valid handshake token for a session', async () => {
    const { service } = makeService({
      jwtVerifyResult: { type: 'handshake', sub: 'user-uuid', leagueId: 'league-uuid' },
      redisGetdel: 'user-uuid:league-uuid',
    });

    const result = await service.exchangeHandshake({ token: 'valid-token' });

    expect(result).toHaveProperty('access_token');
    expect(result.user).toMatchObject({ id: mockUser.id });
  });

  it('throws UnauthorizedException when token is already used (GETDEL returns null)', async () => {
    const { service } = makeService({
      jwtVerifyResult: { type: 'handshake', sub: 'user-uuid', leagueId: 'league-uuid' },
      redisGetdel: null,
    });

    await expect(service.exchangeHandshake({ token: 'used-token' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when payload type is not handshake', async () => {
    const { service } = makeService({
      jwtVerifyResult: { type: 'access', sub: 'user-uuid' },
      redisGetdel: 'user-uuid:league-uuid',
    });

    await expect(service.exchangeHandshake({ token: 'access-token' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when jwtService.verify throws', async () => {
    const { service } = makeService({
      jwtVerifyResult: null,
    });

    await expect(service.exchangeHandshake({ token: 'bad-token' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
