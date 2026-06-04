import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { LeaguesRepository } from '../../leagues/leagues.repository';

function makeCtx(
  user: Record<string, unknown> | null,
  headers: Record<string, string> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, headers }),
    }),
  } as unknown as ExecutionContext;
}

function mockLeaguesRepo(league: { status: string } | null): LeaguesRepository {
  return {
    findById: jest.fn().mockResolvedValue(league),
  } as unknown as LeaguesRepository;
}

describe('TenantGuard', () => {
  it('allows PLATFORM_ADMIN with no header (platform-level access)', async () => {
    const guard = new TenantGuard(mockLeaguesRepo(null));
    const ctx = makeCtx({ role: 'PLATFORM_ADMIN', leagueId: null });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows PLATFORM_ADMIN with valid X-Active-League-Id header', async () => {
    const guard = new TenantGuard(mockLeaguesRepo({ status: 'ACTIVE' }));
    const ctx = makeCtx(
      { role: 'PLATFORM_ADMIN', leagueId: null },
      { 'x-active-league-id': 'league-uuid-123' },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when PLATFORM_ADMIN header points to SUSPENDED league', async () => {
    const guard = new TenantGuard(mockLeaguesRepo({ status: 'SUSPENDED' }));
    const ctx = makeCtx(
      { role: 'PLATFORM_ADMIN', leagueId: null },
      { 'x-active-league-id': 'league-uuid-123' },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows access when non-admin user has ACTIVE league', async () => {
    const guard = new TenantGuard(mockLeaguesRepo({ status: 'ACTIVE' }));
    const ctx = makeCtx({ role: 'SUPER_ADMIN', leagueId: 'league-uuid-123' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when non-admin user has no leagueId', async () => {
    const guard = new TenantGuard(mockLeaguesRepo(null));
    const ctx = makeCtx({ role: 'SUPER_ADMIN', leagueId: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when non-admin user league is SUSPENDED', async () => {
    const guard = new TenantGuard(mockLeaguesRepo({ status: 'SUSPENDED' }));
    const ctx = makeCtx({ role: 'SUPER_ADMIN', leagueId: 'league-uuid-123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException when user is not present', async () => {
    const guard = new TenantGuard(mockLeaguesRepo(null));
    const ctx = makeCtx(null);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
