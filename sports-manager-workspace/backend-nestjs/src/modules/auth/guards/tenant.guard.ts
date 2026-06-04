import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../../database/database.module';
import * as schema from '../../../database/schema';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new UnauthorizedException();

    if (user.role === 'PLATFORM_ADMIN') {
      const activeLeagueHeader = req.headers['x-active-league-id'] as string | undefined;
      if (activeLeagueHeader) {
        const [league] = await this.db
          .select({ status: schema.leagues.status })
          .from(schema.leagues)
          .where(eq(schema.leagues.id, activeLeagueHeader))
          .limit(1);
        if (!league) throw new ForbiddenException('Liga no encontrada');
        if (league.status !== 'ACTIVE') throw new ForbiddenException('Liga suspendida');
        req.activeLeagueId = activeLeagueHeader;
      }
      return true;
    }

    if (!user.leagueId) {
      throw new ForbiddenException('Sin liga asignada. Por favor iniciá sesión nuevamente.');
    }

    if (!req.__leagueStatusChecked) {
      const [league] = await this.db
        .select({ status: schema.leagues.status })
        .from(schema.leagues)
        .where(eq(schema.leagues.id, user.leagueId))
        .limit(1);
      req.__leagueStatusChecked = true;
      if (league?.status !== 'ACTIVE') throw new ForbiddenException('Liga suspendida');
    }

    return true;
  }
}
