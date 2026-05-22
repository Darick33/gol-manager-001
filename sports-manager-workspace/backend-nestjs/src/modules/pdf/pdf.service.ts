import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';
import { join } from 'path';
import PDFDocument from 'pdfkit';

const FONT_REGULAR = join(process.cwd(), 'src', 'modules', 'pdf', 'fonts', 'Arial-Regular.ttf');
const FONT_BOLD = join(process.cwd(), 'src', 'modules', 'pdf', 'fonts', 'Arial-Bold.ttf');

export interface PlayerEventDetail {
  minute: number;
  eventType: string;
  playerId: string | null;
  playerName: string | null;
  playerDorsal: number | null;
  teamId: string;
}

export interface ActaPayment {
  teamId: string;
  method: 'CASH' | 'TRANSFER';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  receiptUrl: string | null;
}

export interface ActaData {
  tournament: {
    name: string;
    sportType: string;
    yellowCardFine: number;
    redCardFine: number;
    courtFee: number;
    refereeFee: number;
    refereeFeeEnabled: boolean;
  };
  match: {
    scheduledAt: Date | null;
    homeTeamId: string;
    awayTeamId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamColor: string | null;
    awayTeamColor: string | null;
    homeScore: number;
    awayScore: number;
  };
  events: PlayerEventDetail[];
  payments: ActaPayment[];
}

const C = {
  headerBg: '#0f172a',
  accent: '#10b981',
  white: '#ffffff',
  dark: '#0f172a',
  mid: '#374151',
  light: '#6b7280',
  lighter: '#9ca3af',
  divider: '#e5e7eb',
  surface: '#f8fafc',
  surfaceBorder: '#e2e8f0',
  goal: '#10b981',
  yellow: '#eab308',
  red: '#ef4444',
  subst: '#6b7280',
  homeDef: '#3b82f6',
  awayDef: '#ef4444',
};

const PAGE_W = 612;
const M = 45;
const CONTENT_W = PAGE_W - M * 2;

type Doc = InstanceType<typeof PDFDocument>;

@Injectable()
export class PdfService {
  async generateActa(data: ActaData): Promise<Buffer> {
    // Pre-fetch all receipt images before opening the PDF stream
    const receiptImages = new Map<string, Buffer>();
    for (const p of data.payments) {
      if (p.receiptUrl && p.status === 'APPROVED' && p.method === 'TRANSFER') {
        try {
          receiptImages.set(p.receiptUrl, await this.fetchImageBuffer(p.receiptUrl));
        } catch {
          // image unavailable — will show placeholder text
        }
      }
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Page 1 — match info
      this.drawHeader(doc, data);
      this.drawScoreboard(doc, data);
      let y = this.drawEventSection(doc, data);
      y = this.drawSummary(doc, data, y);
      y = this.drawFinancial(doc, data, y);
      this.drawFooter(doc, y);

      // Page 2 — payments
      doc.addPage();
      this.drawPaymentsPage(doc, data, receiptImages);

      doc.end();
    });
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  private drawHeader(doc: Doc, data: ActaData): void {
    const H = 105;

    doc.rect(0, 0, PAGE_W, H).fill(C.headerBg);
    doc.rect(0, H - 5, PAGE_W, 5).fill(C.accent);

    // "ACTA DE PARTIDO" badge
    doc.fillColor(C.accent).font(FONT_BOLD).fontSize(8)
      .text('ACTA DE PARTIDO', M, 12, { width: CONTENT_W, align: 'right', characterSpacing: 1.2 });

    // Tournament name
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(21)
      .text(data.tournament.name.toUpperCase(), M, 26, { width: CONTENT_W, align: 'center' });

    // Sport | Date
    const sport = data.tournament.sportType === 'FUTSAL' ? 'Fútbol Sala' : 'Fútbol';
    const dateStr = data.match.scheduledAt
      ? new Date(data.match.scheduledAt).toLocaleDateString('es-CO', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }) + '  ·  ' + new Date(data.match.scheduledAt).toLocaleTimeString('es-CO', {
          hour: '2-digit', minute: '2-digit',
        })
      : 'Fecha por confirmar';

    doc.fillColor('#94a3b8').font(FONT_REGULAR).fontSize(10)
      .text(`${sport}  ·  ${dateStr}`, M, 61, { width: CONTENT_W, align: 'center' });
  }

  // ─── Scoreboard ────────────────────────────────────────────────────────────

  private drawScoreboard(doc: Doc, data: ActaData): void {
    const y = 110;
    const H = 82;
    const homeColor = data.match.homeTeamColor ?? C.homeDef;
    const awayColor = data.match.awayTeamColor ?? C.awayDef;

    // Card background
    doc.rect(M, y, CONTENT_W, H).fill(C.surface);
    doc.rect(M, y, CONTENT_W, H).stroke(C.surfaceBorder);

    // Team color strips
    doc.rect(M, y, 6, H).fill(homeColor);
    doc.rect(M + CONTENT_W - 6, y, 6, H).fill(awayColor);

    const teamW = Math.floor(CONTENT_W * 0.34);
    const scoreW = CONTENT_W - teamW * 2;

    // Home team
    doc.fillColor(C.dark).font(FONT_BOLD).fontSize(13)
      .text(data.match.homeTeamName.toUpperCase(), M + 12, y + 16, { width: teamW - 12 });
    doc.fillColor(C.light).font(FONT_REGULAR).fontSize(8.5)
      .text('LOCAL', M + 12, y + 33, { width: teamW - 12, characterSpacing: 0.8 });

    // Score (large, centered)
    const scoreStr = `${data.match.homeScore}  -  ${data.match.awayScore}`;
    doc.fillColor(C.dark).font(FONT_BOLD).fontSize(30)
      .text(scoreStr, M + teamW, y + 19, { width: scoreW, align: 'center' });

    // Away team
    doc.fillColor(C.dark).font(FONT_BOLD).fontSize(13)
      .text(data.match.awayTeamName.toUpperCase(), M + teamW + scoreW, y + 16, { width: teamW - 12, align: 'right' });
    doc.fillColor(C.light).font(FONT_REGULAR).fontSize(8.5)
      .text('VISITANTE', M + teamW + scoreW, y + 33, { width: teamW - 12, align: 'right', characterSpacing: 0.8 });

    // Thin accent line under score
    const scoreCenterX = M + teamW + scoreW / 2;
    doc.moveTo(scoreCenterX - 25, y + H - 14)
      .lineTo(scoreCenterX + 25, y + H - 14)
      .strokeColor(C.accent).lineWidth(2).stroke();
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  private drawEventSection(doc: Doc, data: ActaData): number {
    let y = 205;

    const homeEvents = data.events.filter((e) => e.teamId === data.match.homeTeamId);
    const awayEvents = data.events.filter((e) => e.teamId === data.match.awayTeamId);
    const homeColor = data.match.homeTeamColor ?? C.homeDef;
    const awayColor = data.match.awayTeamColor ?? C.awayDef;

    y = this.drawTeamSection(doc, `LOCAL — ${data.match.homeTeamName}`, homeColor, homeEvents, y);
    y += 10;
    y = this.drawTeamSection(doc, `VISITANTE — ${data.match.awayTeamName}`, awayColor, awayEvents, y);

    return y;
  }

  private drawTeamSection(
    doc: Doc,
    title: string,
    color: string,
    events: PlayerEventDetail[],
    startY: number,
  ): number {
    let y = startY;

    // Section header bar
    doc.rect(M, y, CONTENT_W, 24).fill(this.hexWithAlpha(color, 0.12));
    doc.rect(M, y, 5, 24).fill(color);
    doc.fillColor(color).font(FONT_BOLD).fontSize(10)
      .text(title, M + 14, y + 7, { width: CONTENT_W - 20, characterSpacing: 0.3 });
    y += 30;

    const grouped = this.groupByPlayer(events);

    if (grouped.length === 0) {
      doc.fillColor(C.lighter).font(FONT_REGULAR).fontSize(9.5)
        .text('Sin eventos registrados para este equipo.', M + 16, y);
      y += 18;
      return y;
    }

    for (const player of grouped) {
      const nameLabel = player.playerName
        ? `#${player.playerDorsal ?? '?'}  ${player.playerName}`
        : 'Jugador no identificado';

      doc.fillColor(C.dark).font(FONT_BOLD).fontSize(10)
        .text(nameLabel, M + 16, y, { width: CONTENT_W - 32 });
      y += 15;

      for (const ev of player.events.sort((a, b) => a.minute - b.minute)) {
        this.drawEventShape(doc, ev.eventType, M + 24, y + 1);
        doc.fillColor(C.mid).font(FONT_REGULAR).fontSize(9)
          .text(`${ev.minute}'  ${this.eventLabel(ev.eventType)}`, M + 38, y, { width: CONTENT_W - 60 });
        y += 13;
      }

      y += 5;
    }

    return y;
  }

  private groupByPlayer(events: PlayerEventDetail[]) {
    const map = new Map<string, { playerName: string | null; playerDorsal: number | null; events: PlayerEventDetail[] }>();
    for (const e of events) {
      const key = e.playerId ?? `__none_${e.minute}_${e.eventType}`;
      if (!map.has(key)) {
        map.set(key, { playerName: e.playerName, playerDorsal: e.playerDorsal, events: [] });
      }
      map.get(key)!.events.push(e);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.playerDorsal !== null && b.playerDorsal === null) return -1;
      if (a.playerDorsal === null && b.playerDorsal !== null) return 1;
      return (a.playerDorsal ?? 99) - (b.playerDorsal ?? 99);
    });
  }

  private drawEventShape(doc: Doc, eventType: string, x: number, y: number): void {
    if (eventType === 'GOAL') {
      doc.circle(x + 5, y + 5, 5).fill(C.goal);
    } else if (eventType === 'YELLOW_CARD') {
      doc.roundedRect(x + 1, y, 8, 11, 1.5).fill(C.yellow);
    } else if (eventType === 'RED_CARD') {
      doc.roundedRect(x + 1, y, 8, 11, 1.5).fill(C.red);
    } else if (eventType === 'SUBSTITUTION') {
      doc.roundedRect(x + 1, y, 8, 11, 3).fill(C.subst);
    } else if (eventType === 'FOUL') {
      doc.moveTo(x + 1, y + 5).lineTo(x + 9, y + 5).strokeColor('#f97316').lineWidth(2).stroke();
    }
  }

  private eventLabel(type: string): string {
    if (type === 'GOAL') return 'GOL';
    if (type === 'YELLOW_CARD') return 'TARJETA AMARILLA';
    if (type === 'RED_CARD') return 'TARJETA ROJA';
    if (type === 'SUBSTITUTION') return 'SUSTITUCIÓN';
    if (type === 'FOUL') return 'FALTA';
    return type;
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  private drawSummary(doc: Doc, data: ActaData, startY: number): number {
    let y = startY + 12;

    this.drawDivider(doc, y);
    y += 14;

    doc.fillColor(C.accent).font(FONT_BOLD).fontSize(10.5)
      .text('RESUMEN DEL PARTIDO', M, y, { characterSpacing: 0.5 });
    y += 18;

    const count = (teamId: string, type: string) =>
      data.events.filter((e) => e.teamId === teamId && e.eventType === type).length;

    const hId = data.match.homeTeamId;
    const aId = data.match.awayTeamId;

    const colW = CONTENT_W / 2 - 8;

    // Home column
    doc.fillColor(C.dark).font(FONT_BOLD).fontSize(10)
      .text(data.match.homeTeamName, M, y, { width: colW });
    // Away column
    doc.fillColor(C.dark).font(FONT_BOLD).fontSize(10)
      .text(data.match.awayTeamName, M + CONTENT_W / 2 + 8, y, { width: colW });
    y += 14;

    const statLine = (label: string, hVal: number, aVal: number) => {
      doc.fillColor(C.mid).font(FONT_REGULAR).fontSize(9.5)
        .text(`${label}: ${hVal}`, M + 4, y, { width: colW - 4 })
        .text(`${label}: ${aVal}`, M + CONTENT_W / 2 + 12, y, { width: colW - 4 });
      y += 13;
    };

    statLine('Goles', count(hId, 'GOAL'), count(aId, 'GOAL'));
    statLine('Amarillas', count(hId, 'YELLOW_CARD'), count(aId, 'YELLOW_CARD'));
    statLine('Rojas', count(hId, 'RED_CARD'), count(aId, 'RED_CARD'));

    y += 6;
    return y;
  }

  // ─── Financial ─────────────────────────────────────────────────────────────

  private drawFinancial(doc: Doc, data: ActaData, startY: number): number {
    let y = startY + 8;

    this.drawDivider(doc, y);
    y += 14;

    doc.fillColor(C.accent).font(FONT_BOLD).fontSize(10.5)
      .text('COSTOS DEL PARTIDO', M, y, { characterSpacing: 0.5 });
    y += 20;

    const hId = data.match.homeTeamId;
    const aId = data.match.awayTeamId;

    const hYellow = data.events.filter((e) => e.teamId === hId && e.eventType === 'YELLOW_CARD').length;
    const hRed = data.events.filter((e) => e.teamId === hId && e.eventType === 'RED_CARD').length;
    const aYellow = data.events.filter((e) => e.teamId === aId && e.eventType === 'YELLOW_CARD').length;
    const aRed = data.events.filter((e) => e.teamId === aId && e.eventType === 'RED_CARD').length;

    const hFines = hYellow * data.tournament.yellowCardFine + hRed * data.tournament.redCardFine;
    const aFines = aYellow * data.tournament.yellowCardFine + aRed * data.tournament.redCardFine;
    const grandTotal = hFines + aFines + data.tournament.courtFee + data.tournament.refereeFee;

    const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`;

    const row = (label: string, value: string, labelColor = C.mid, valueColor = C.dark) => {
      doc.fillColor(labelColor).font(FONT_REGULAR).fontSize(9.5).text(label, M + 10, y, { width: CONTENT_W - 90 });
      doc.fillColor(valueColor).font(FONT_BOLD).fontSize(9.5).text(value, M + CONTENT_W - 72, y, { width: 72, align: 'right' });
      y += 14;
    };

    // Fines sub-header
    doc.fillColor(C.lighter).font(FONT_BOLD).fontSize(8.5)
      .text('MULTAS POR TARJETAS', M + 10, y, { characterSpacing: 0.8 });
    y += 14;

    let hasFines = false;
    if (hYellow > 0) { row(`${data.match.homeTeamName}: ${hYellow} amarilla${hYellow > 1 ? 's' : ''} × ${fmt(data.tournament.yellowCardFine)}`, fmt(hYellow * data.tournament.yellowCardFine)); hasFines = true; }
    if (hRed > 0)    { row(`${data.match.homeTeamName}: ${hRed} roja${hRed > 1 ? 's' : ''} × ${fmt(data.tournament.redCardFine)}`, fmt(hRed * data.tournament.redCardFine)); hasFines = true; }
    if (aYellow > 0) { row(`${data.match.awayTeamName}: ${aYellow} amarilla${aYellow > 1 ? 's' : ''} × ${fmt(data.tournament.yellowCardFine)}`, fmt(aYellow * data.tournament.yellowCardFine)); hasFines = true; }
    if (aRed > 0)    { row(`${data.match.awayTeamName}: ${aRed} roja${aRed > 1 ? 's' : ''} × ${fmt(data.tournament.redCardFine)}`, fmt(aRed * data.tournament.redCardFine)); hasFines = true; }
    if (!hasFines) {
      doc.fillColor(C.lighter).font(FONT_REGULAR).fontSize(9).text('Sin tarjetas — sin multas.', M + 10, y);
      y += 14;
    }

    y += 8;

    // Fixed costs sub-header
    doc.fillColor(C.lighter).font(FONT_BOLD).fontSize(8.5)
      .text('COSTOS FIJOS', M + 10, y, { characterSpacing: 0.8 });
    y += 14;

    row('Valor de la cancha', fmt(data.tournament.courtFee));
    row('Valor del árbitro', fmt(data.tournament.refereeFee));

    y += 6;
    doc.moveTo(M + CONTENT_W - 140, y).lineTo(M + CONTENT_W, y).strokeColor(C.divider).lineWidth(0.8).stroke();
    y += 6;

    // Grand total — dark box
    doc.rect(M, y, CONTENT_W, 34).fill(C.headerBg);
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(11)
      .text('TOTAL DEL PARTIDO', M + 12, y + 10, { width: CONTENT_W - 100 });
    doc.fillColor(C.accent).font(FONT_BOLD).fontSize(13)
      .text(fmt(grandTotal), M + CONTENT_W - 100, y + 8, { width: 88, align: 'right' });
    y += 44;

    return y;
  }

  // ─── Payments (page 2) ─────────────────────────────────────────────────────

  private drawPaymentsPage(doc: Doc, data: ActaData, receiptImages: Map<string, Buffer>): void {
    const PAGE_H = 792;
    const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`;

    // Page 2 header bar
    doc.rect(0, 0, PAGE_W, 56).fill(C.headerBg);
    doc.rect(0, 51, PAGE_W, 5).fill(C.accent);
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(16)
      .text('ESTADO DE PAGOS', M, 14, { width: CONTENT_W, align: 'center' });
    doc.fillColor('#94a3b8').font(FONT_REGULAR).fontSize(9)
      .text(data.tournament.name, M, 34, { width: CONTENT_W, align: 'center' });

    let y = 72;

    const teams = [
      { id: data.match.homeTeamId, name: data.match.homeTeamName, color: data.match.homeTeamColor ?? C.homeDef },
      { id: data.match.awayTeamId, name: data.match.awayTeamName, color: data.match.awayTeamColor ?? C.awayDef },
    ];

    for (const team of teams) {
      const payment = data.payments.find(
        (p) => p.teamId === team.id && (p.status === 'APPROVED' || p.status === 'PENDING'),
      );

      const imgBuf = payment?.receiptUrl ? receiptImages.get(payment.receiptUrl) : undefined;
      const IMG_MAX_W = CONTENT_W - 32;
      const IMG_MAX_H = 220;

      // Base card height: label row (36) + detail row (28) + bottom padding (16)
      const baseH = 80;
      const cardH = imgBuf ? baseH + IMG_MAX_H + 12 : baseH;

      const bgColor = payment?.status === 'APPROVED'
        ? '#f0fdf4'
        : payment?.status === 'PENDING' ? '#fefce8' : '#fef2f2';

      // Card background + border
      doc.rect(M, y, CONTENT_W, cardH).fill(bgColor);
      doc.rect(M, y, CONTENT_W, cardH).stroke(C.surfaceBorder);
      // Team color strip
      doc.rect(M, y, 6, cardH).fill(team.color);

      // Team name
      doc.fillColor(C.dark).font(FONT_BOLD).fontSize(13)
        .text(team.name.toUpperCase(), M + 18, y + 14, { width: CONTENT_W - 130 });

      if (!payment) {
        doc.fillColor(C.red).font(FONT_BOLD).fontSize(11)
          .text('PENDIENTE', M + CONTENT_W - 105, y + 14, { width: 93, align: 'right' });
        doc.fillColor(C.light).font(FONT_REGULAR).fontSize(10)
          .text('Sin pago registrado', M + 18, y + 46, { width: CONTENT_W - 130 });

      } else if (payment.status === 'APPROVED') {
        const methodLabel = payment.method === 'CASH' ? 'Efectivo' : 'Transferencia';
        doc.fillColor('#16a34a').font(FONT_BOLD).fontSize(11)
          .text('✓  PAGADO', M + CONTENT_W - 105, y + 14, { width: 93, align: 'right' });
        doc.fillColor(C.mid).font(FONT_REGULAR).fontSize(10)
          .text(`Método: ${methodLabel}`, M + 18, y + 46, { width: 200 });
        doc.fillColor(C.dark).font(FONT_BOLD).fontSize(11)
          .text(fmt(payment.amount), M + CONTENT_W - 105, y + 44, { width: 93, align: 'right' });

        if (imgBuf) {
          const imgY = y + baseH;
          try {
            doc.image(imgBuf, M + 16, imgY, { fit: [IMG_MAX_W, IMG_MAX_H], align: 'center' });
          } catch {
            doc.fillColor(C.lighter).font(FONT_REGULAR).fontSize(9)
              .text('(no se pudo cargar el comprobante)', M + 18, imgY + 8);
          }
        }

      } else {
        // PENDING review
        doc.fillColor('#b45309').font(FONT_BOLD).fontSize(11)
          .text('EN REVISIÓN', M + CONTENT_W - 105, y + 14, { width: 93, align: 'right' });
        doc.fillColor(C.mid).font(FONT_REGULAR).fontSize(10)
          .text('Comprobante enviado · pendiente de aprobación', M + 18, y + 46, { width: CONTENT_W - 130 });
        doc.fillColor(C.dark).font(FONT_BOLD).fontSize(11)
          .text(fmt(payment.amount), M + CONTENT_W - 105, y + 44, { width: 93, align: 'right' });
      }

      y += cardH + 18;
    }

    // Footer
    const footerY = Math.max(y + 12, PAGE_H - 50);
    this.drawFooter(doc, footerY);
  }

  // ─── Footer ────────────────────────────────────────────────────────────────

  private drawFooter(doc: Doc, startY: number): void {
    const y = startY + 16;
    this.drawDivider(doc, y, 0.4);

    doc.fillColor(C.lighter).font(FONT_REGULAR).fontSize(7.5)
      .text(
        `Acta generada automáticamente · ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
        M, y + 8, { width: CONTENT_W, align: 'center' },
      );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private fetchImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this.fetchImageBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
    });
  }

  private drawDivider(doc: Doc, y: number, opacity = 1): void {
    doc.moveTo(M, y).lineTo(M + CONTENT_W, y)
      .strokeColor(C.divider).lineWidth(opacity).stroke();
  }

  private hexWithAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
