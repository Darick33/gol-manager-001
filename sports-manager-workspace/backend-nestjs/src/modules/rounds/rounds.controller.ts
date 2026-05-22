import { Controller, Get, Param, ParseIntPipe, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoundsService } from './rounds.service';

@ApiTags('rounds')
@Controller('rounds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'VOCAL')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('tournament/:tournamentId')
  findByTournament(@Param('tournamentId') tournamentId: string) {
    return this.roundsService.getTournamentRounds(tournamentId);
  }

  @Patch('tournament/:tournamentId/stage/:stage/close')
  closeRound(
    @Param('tournamentId') tournamentId: string,
    @Param('stage', ParseIntPipe) stage: number,
    @Request() req: { user: { sub: string } },
  ) {
    return this.roundsService.closeRound(tournamentId, stage, req.user.sub);
  }
}
