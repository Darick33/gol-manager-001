import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new UnauthorizedException();

    // PLATFORM_ADMIN bypasses all tenant checks (leagueId = null)
    if (user.role === 'PLATFORM_ADMIN') return true;

    // All other roles must have a leagueId assigned
    if (!user.leagueId) {
      throw new ForbiddenException('Sin liga asignada. Por favor iniciá sesión nuevamente.');
    }

    return true;
  }
}
