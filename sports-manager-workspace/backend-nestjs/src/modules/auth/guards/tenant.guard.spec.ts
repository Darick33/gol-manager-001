import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

function makeCtx(user: Record<string, unknown> | null): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('bypasses check for PLATFORM_ADMIN (leagueId null)', () => {
    const ctx = makeCtx({ role: 'PLATFORM_ADMIN', leagueId: null });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user leagueId is present (LIGA_ADMIN)', () => {
    const ctx = makeCtx({ role: 'SUPER_ADMIN', leagueId: 'league-uuid-123' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when non-admin user has no leagueId', () => {
    const ctx = makeCtx({ role: 'SUPER_ADMIN', leagueId: null });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException when user is not present', () => {
    const ctx = makeCtx(null);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
