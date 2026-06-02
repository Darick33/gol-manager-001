import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { LeaguesRepository } from './leagues.repository';

@Injectable()
export class LeagueMiddleware implements NestMiddleware {
  constructor(private leaguesRepository: LeaguesRepository) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const subdomain = req.headers['x-league-subdomain'] as string | undefined;
    const queryLeague = (req.query as Record<string, string>).league;
    const slug = subdomain || queryLeague;

    if (slug) {
      const league = await this.leaguesRepository.findBySlug(slug);
      if (!league) {
        res.status(404).json({ message: `Liga '${slug}' no encontrada` });
        return;
      }
      (req as any).league = league;
    } else {
      (req as any).league = null;
    }

    next();
  }
}
