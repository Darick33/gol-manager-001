import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { FinesRepository } from '../fines/fines.repository';
import { PaymentsRepository } from '../payments/payments.repository';
import { PublicService } from '../public/public.service';

export type ExportFormat = 'csv' | 'xlsx';

const formatDate = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('es-CO');
};

const formatCOP = (n: number | null | undefined): number => n ?? 0;

@Injectable()
export class ExportsService {
  constructor(
    private readonly publicService: PublicService,
    private readonly finesRepository: FinesRepository,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  async generateStandings(tournamentId: string, format: ExportFormat): Promise<Buffer> {
    const rows = await this.publicService.getStandingsById(tournamentId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Posiciones');

    ws.columns = [
      { header: 'Pos', key: 'pos', width: 5 },
      { header: 'Equipo', key: 'team', width: 30 },
      { header: 'PJ', key: 'played', width: 6 },
      { header: 'G', key: 'won', width: 6 },
      { header: 'E', key: 'drawn', width: 6 },
      { header: 'P', key: 'lost', width: 6 },
      { header: 'GF', key: 'gf', width: 6 },
      { header: 'GC', key: 'gc', width: 6 },
      { header: 'DG', key: 'gd', width: 6 },
      { header: 'Pts', key: 'pts', width: 6 },
    ];

    rows.forEach((r, i) =>
      ws.addRow({
        pos: i + 1,
        team: r.team.name,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        gf: r.goalsFor,
        gc: r.goalsAgainst,
        gd: r.goalDifference,
        pts: r.points,
      }),
    );

    return this.toBuffer(wb, format);
  }

  async generateScorers(tournamentId: string, format: ExportFormat): Promise<Buffer> {
    const rows = await this.publicService.getScorersByTournamentId(tournamentId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Goleadores');

    ws.columns = [
      { header: 'Pos', key: 'pos', width: 5 },
      { header: 'Jugador', key: 'player', width: 30 },
      { header: 'Dorsal', key: 'dorsal', width: 8 },
      { header: 'Equipo', key: 'team', width: 30 },
      { header: 'Goles', key: 'goals', width: 8 },
    ];

    rows.forEach((r, i) =>
      ws.addRow({
        pos: i + 1,
        player: r.player.name,
        dorsal: r.player.dorsal,
        team: r.team.name,
        goals: r.goals,
      }),
    );

    return this.toBuffer(wb, format);
  }

  async generateFines(tournamentId: string, format: ExportFormat): Promise<Buffer> {
    const rows = await this.finesRepository.findByTournamentWithTeamName(tournamentId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Multas');

    ws.columns = [
      { header: 'Equipo', key: 'team', width: 30 },
      { header: 'Motivo', key: 'reason', width: 40 },
      { header: 'Monto', key: 'amount', width: 12 },
      { header: 'Mitad', key: 'half', width: 8 },
      { header: 'Estado', key: 'status', width: 10 },
      { header: 'Fecha', key: 'date', width: 14 },
    ];

    rows.forEach((r) =>
      ws.addRow({
        team: r.teamName ?? r.teamId,
        reason: r.reason,
        amount: formatCOP(r.amount),
        half: r.half,
        status: r.status === 'PAID' ? 'Pagada' : 'Pendiente',
        date: formatDate(r.createdAt),
      }),
    );

    return this.toBuffer(wb, format);
  }

  async generatePayments(tournamentId: string, format: ExportFormat): Promise<Buffer> {
    const rows = await this.paymentsRepository.findByTournament(tournamentId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Pagos');

    ws.columns = [
      { header: 'Equipo', key: 'team', width: 30 },
      { header: 'Partido', key: 'match', width: 20 },
      { header: 'Método', key: 'method', width: 12 },
      { header: 'Monto', key: 'amount', width: 12 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'URL Comprobante', key: 'receiptUrl', width: 40 },
      { header: 'Fecha', key: 'date', width: 14 },
    ];

    rows.forEach((r) => {
      const matchLabel = r.matchScheduledAt
        ? formatDate(r.matchScheduledAt)
        : r.matchId
          ? r.matchId.slice(0, 8)
          : '—';
      const statusLabel =
        r.status === 'APPROVED' ? 'Aprobado' : r.status === 'REJECTED' ? 'Rechazado' : 'Pendiente';
      const methodLabel = r.method === 'CASH' ? 'Efectivo' : 'Transferencia';

      ws.addRow({
        team: r.teamName ?? r.teamId,
        match: matchLabel,
        method: methodLabel,
        amount: formatCOP(r.amount),
        status: statusLabel,
        receiptUrl: r.receiptUrl ?? '',
        date: formatDate(r.createdAt),
      });
    });

    return this.toBuffer(wb, format);
  }

  private async toBuffer(wb: ExcelJS.Workbook, format: ExportFormat): Promise<Buffer> {
    if (format === 'csv') {
      return Buffer.from(await wb.csv.writeBuffer());
    }
    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }
}
