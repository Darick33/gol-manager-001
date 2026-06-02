import { Controller, Get, NotFoundException, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  private extractLeagueId(req: Request): string {
    const league = (req as any).league;
    if (!league?.id) throw new NotFoundException('Liga no especificada. Usá X-League-Subdomain o ?league=');
    return league.id as string;
  }

  @Get('live')
  getLiveMatches(@Req() req: Request) {
    const leagueId = this.extractLeagueId(req);
    return this.publicService.getLiveMatches(leagueId);
  }

  @Get('tournaments')
  getTournaments(@Req() req: Request) {
    const leagueId = this.extractLeagueId(req);
    return this.publicService.getActiveTournaments(leagueId);
  }

  @Get('tournaments/:slug')
  async getTournament(@Param('slug') slug: string) {
    const tournament = await this.publicService.getTournamentBySlug(slug);
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    return tournament;
  }

  @Get('tournaments/:slug/matches')
  async getMatches(@Param('slug') slug: string) {
    const matches = await this.publicService.getMatchesBySlug(slug);
    if (matches === null) throw new NotFoundException('Torneo no encontrado');
    return matches;
  }

  @Get('tournaments/:slug/standings')
  async getStandings(@Param('slug') slug: string) {
    const standings = await this.publicService.getStandingsBySlug(slug);
    if (standings === null) throw new NotFoundException('Torneo no encontrado');
    return standings;
  }

  @Get('tournaments/:slug/scorers')
  async getScorers(@Param('slug') slug: string) {
    const scorers = await this.publicService.getScorersBySlug(slug);
    if (scorers === null) throw new NotFoundException('Torneo no encontrado');
    return scorers;
  }

  @Get('by-id/:id/scorers')
  getScorersById(@Param('id') id: string) {
    return this.publicService.getScorersByTournamentId(id);
  }
}
