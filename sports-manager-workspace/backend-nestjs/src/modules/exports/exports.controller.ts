import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExportFormat, ExportsService } from './exports.service';

@Controller('tournaments/:id/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('standings')
  async standings(
    @Param('id') id: string,
    @Query('format') fmt: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() reply: any,
  ) {
    const format: ExportFormat = fmt === 'csv' ? 'csv' : 'xlsx';
    const buf = await this.exportsService.generateStandings(id, format);
    void reply
      .header('Content-Type', this.mime(format))
      .header('Content-Disposition', `attachment; filename="posiciones-${id}.${format}"`)
      .send(buf);
  }

  @Get('scorers')
  async scorers(
    @Param('id') id: string,
    @Query('format') fmt: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() reply: any,
  ) {
    const format: ExportFormat = fmt === 'csv' ? 'csv' : 'xlsx';
    const buf = await this.exportsService.generateScorers(id, format);
    void reply
      .header('Content-Type', this.mime(format))
      .header('Content-Disposition', `attachment; filename="goleadores-${id}.${format}"`)
      .send(buf);
  }

  @Get('fines')
  async fines(
    @Param('id') id: string,
    @Query('format') fmt: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() reply: any,
  ) {
    const format: ExportFormat = fmt === 'csv' ? 'csv' : 'xlsx';
    const buf = await this.exportsService.generateFines(id, format);
    void reply
      .header('Content-Type', this.mime(format))
      .header('Content-Disposition', `attachment; filename="multas-${id}.${format}"`)
      .send(buf);
  }

  @Get('payments')
  async payments(
    @Param('id') id: string,
    @Query('format') fmt: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() reply: any,
  ) {
    const format: ExportFormat = fmt === 'csv' ? 'csv' : 'xlsx';
    const buf = await this.exportsService.generatePayments(id, format);
    void reply
      .header('Content-Type', this.mime(format))
      .header('Content-Disposition', `attachment; filename="pagos-${id}.${format}"`)
      .send(buf);
  }

  private mime(format: ExportFormat): string {
    return format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
}
