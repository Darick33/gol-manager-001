import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LeaguesRepository } from '../../leagues/leagues.repository';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private leaguesRepository: LeaguesRepository) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new UnauthorizedException();

    if (user.role === 'PLATFORM_ADMIN') {
      const activeLeagueHeader = req.headers['x-active-league-id'] as string | undefined;
      if (activeLeagueHeader) {
        // Validate that the league exists and is not suspended
        const league = await this.leaguesRepository.findById(activeLeagueHeader);
        if (!league) {
          throw new ForbiddenException('Liga no encontrada');
        }
        if (league.status === 'SUSPENDED') {
          throw new ForbiddenException('Liga suspendida');
        }
        req.activeLeagueId = activeLeagueHeader;
      }
      // No header → platform-level access, no league context required
      return true;
    }

    // All other roles must have a leagueId assigned
    if (!user.leagueId) {
      throw new ForbiddenException('Sin liga asignada. Por favor iniciá sesión nuevamente.');
    }

    // Check league suspension per-request (cache via flag to avoid double lookup)
    if (!req.__leagueStatusChecked) {
      const league = await this.leaguesRepository.findById(user.leagueId);
      req.__leagueStatusChecked = true;
      if (league?.status === 'SUSPENDED') {
        throw new ForbiddenException('Liga suspendida');
      }
    }

    return true;
  }
}
