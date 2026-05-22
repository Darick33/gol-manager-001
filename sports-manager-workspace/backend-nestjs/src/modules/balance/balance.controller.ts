import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BalanceService } from './balance.service';

@Controller('balances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'VOCAL')
export class BalanceController {
  constructor(private balanceService: BalanceService) {}

  @Get('tournament/:tournamentId')
  getTournamentBalances(@Param('tournamentId') tournamentId: string) {
    return this.balanceService.getTournamentBalances(tournamentId);
  }

  @Get('team/:teamId/tournament/:tournamentId')
  getTeamSummary(
    @Param('teamId') teamId: string,
    @Param('tournamentId') tournamentId: string,
  ) {
    return this.balanceService.getTeamSummary(teamId, tournamentId);
  }
}
