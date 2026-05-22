import { Body, Controller, Get, Param, Patch, Res, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaymentsRepository } from '../payments/payments.repository';
import { PdfService } from '../pdf/pdf.service';
import { TeamsRepository } from '../teams/teams.repository';
import { TournamentsRepository } from '../tournaments/tournaments.repository';
import { SetColorsDto } from './dto/set-colors.dto';
import { MatchEventsRepository } from './match-events.repository';
import { MatchesRepository } from './matches.repository';

@Controller('matches')
export class MatchesController {
  constructor(
    private matchesRepository: MatchesRepository,
    private matchEventsRepository: MatchEventsRepository,
    private pdfService: PdfService,
    private tournamentsRepository: TournamentsRepository,
    private teamsRepository: TeamsRepository,
    private paymentsRepository: PaymentsRepository,
  ) {}

  @Get('tournament/:tournamentId')
  findByTournament(@Param('tournamentId') tournamentId: string) {
    return this.matchesRepository.findByTournament(tournamentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const match = await this.matchesRepository.findById(id);
    const events = await this.matchEventsRepository.findByMatch(id);
    return { match, events };
  }

  @Get(':id/acta')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async downloadActa(@Param('id') id: string, @Res() reply: any) {
    try {
      const match = await this.matchesRepository.findById(id);
      if (!match) {
        void reply.status(404).send({ message: 'Partido no encontrado' });
        return;
      }

      const [tournament, events, homeTeam, awayTeam, payments] = await Promise.all([
        this.tournamentsRepository.findById(match.tournamentId),
        this.matchEventsRepository.findByMatchWithPlayers(id),
        this.teamsRepository.findById(match.homeTeamId),
        this.teamsRepository.findById(match.awayTeamId),
        this.paymentsRepository.findByMatch(id),
      ]);

      const actaData = {
        tournament: {
          name: tournament?.name ?? '',
          sportType: tournament?.sportType ?? '',
          yellowCardFine: tournament?.yellowCardFine ?? 0,
          redCardFine: tournament?.redCardFine ?? 0,
          courtFee: tournament?.courtFee ?? 0,
          refereeFee: tournament?.refereeFee ?? 0,
          refereeFeeEnabled: tournament?.refereeFeeEnabled ?? false,
        },
        match: {
          scheduledAt: match.scheduledAt,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeTeamName: homeTeam?.name ?? '',
          awayTeamName: awayTeam?.name ?? '',
          homeTeamColor: match.homeTeamColor ?? null,
          awayTeamColor: match.awayTeamColor ?? null,
          homeScore: match.homeScore ?? 0,
          awayScore: match.awayScore ?? 0,
        },
        events: events.map((e) => ({
          minute: e.minute,
          eventType: e.eventType,
          playerId: e.playerId ?? null,
          playerName: e.playerName ?? null,
          playerDorsal: e.playerDorsal ?? null,
          teamId: e.teamId,
        })),
        payments: payments.map((p) => ({
          teamId: p.teamId,
          method: p.method as 'CASH' | 'TRANSFER',
          amount: p.amount,
          status: p.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          receiptUrl: p.receiptUrl ?? null,
        })),
      };

      const pdfBuffer = await this.pdfService.generateActa(actaData);

      void reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="acta-${id}.pdf"`)
        .send(pdfBuffer);
    } catch (err) {
      console.error('[acta] Error generando PDF:', err);
      void reply.status(500).send({ message: 'Error generando el acta', detail: (err as Error).message });
    }
  }

  @Patch(':id/colors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'VOCAL')
  setColors(@Param('id') id: string, @Body() dto: SetColorsDto) {
    return this.matchesRepository.updateColors(id, dto.homeColor, dto.awayColor);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  setSchedule(@Param('id') id: string, @Body() body: { scheduledAt: string | null }) {
    const date = body.scheduledAt ? new Date(body.scheduledAt) : null;
    return this.matchesRepository.updateScheduledAt(id, date);
  }
}
