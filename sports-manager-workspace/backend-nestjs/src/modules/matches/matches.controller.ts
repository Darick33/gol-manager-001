import { Body, Controller, Delete, Get, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SetColorsDto } from './dto/set-colors.dto';
import { MatchEventsRepository } from './match-events.repository';
import { MatchOrchestrationService } from './match-orchestration.service';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(
    private matchesRepository: MatchesRepository,
    private matchEventsRepository: MatchEventsRepository,
    private matchesService: MatchesService,
    private orchestrationService: MatchOrchestrationService,
  ) {}

  @Get('tournament/:tournamentId')
  findByTournament(@Param('tournamentId') tournamentId: string) {
    return this.matchesRepository.findByTournament(tournamentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const [match, events] = await Promise.all([
      this.matchesRepository.findById(id),
      this.matchEventsRepository.findByMatch(id),
    ]);
    return { match, events };
  }

  @Get(':id/acta')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'VOCAL', 'DELEGATE')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async downloadActa(@Param('id') id: string, @Res() reply: any) {
    try {
      const pdfBuffer = await this.matchesService.generateActaPdf(id);
      void reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="acta-${id}.pdf"`)
        .send(pdfBuffer);
    } catch (err) {
      const status = (err as any)?.status ?? 500;
      void reply.status(status).send({ message: (err as Error).message });
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

  @Delete(':matchId/events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancelEvent(
    @Param('matchId') _matchId: string,
    @Param('eventId') eventId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.orchestrationService.cancelEvent(
      eventId,
      (req.user as { id: string }).id,
      reason ?? 'Corrección admin',
      'FINISHED',
    );
  }
}
