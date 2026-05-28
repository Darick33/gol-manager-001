import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('live')
  getLiveMatches() {
    return this.publicService.getLiveMatches();
  }

  @Get('tournaments')
  getTournaments() {
    return this.publicService.getActiveTournaments();
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
