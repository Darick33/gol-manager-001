import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateMatchPaymentDto } from './dto/create-match-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('match')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'VOCAL')
  registerMatchPayment(@Body() dto: CreateMatchPaymentDto) {
    return this.paymentsService.registerMatchPayment(dto);
  }

  @Get('match/:matchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'VOCAL')
  findByMatch(@Param('matchId') matchId: string) {
    return this.paymentsService.findByMatch(matchId);
  }

  @Post('fine/:fineId/team/:teamId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELEGATE', 'SUPER_ADMIN')
  uploadReceipt(
    @Param('fineId') fineId: string,
    @Param('teamId') teamId: string,
    @Body('receiptUrl') receiptUrl: string,
  ) {
    return this.paymentsService.uploadReceipt(fineId, teamId, receiptUrl);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  findPending() {
    return this.paymentsService.findPending();
  }

  @Get('team/:teamId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'DELEGATE')
  findByTeam(@Param('teamId') teamId: string) {
    return this.paymentsService.findByTeam(teamId);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  approve(@Param('id') id: string, @Req() req: Request) {
    return this.paymentsService.review(id, 'APPROVED', (req.user as any).id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  reject(@Param('id') id: string, @Req() req: Request) {
    return this.paymentsService.review(id, 'REJECTED', (req.user as any).id);
  }
}
