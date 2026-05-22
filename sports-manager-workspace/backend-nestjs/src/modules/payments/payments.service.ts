import { Injectable, NotFoundException } from '@nestjs/common';
import { BalanceService } from '../balance/balance.service';
import { FinesRepository } from '../fines/fines.repository';
import { WhatsappService } from '../notifications/whatsapp.service';
import { CreateMatchPaymentDto } from './dto/create-match-payment.dto';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private finesRepository: FinesRepository,
    private whatsappService: WhatsappService,
    private balanceService: BalanceService,
  ) {}

  async uploadReceipt(fineId: string, teamId: string, receiptUrl: string) {
    const fine = await this.finesRepository.findById(fineId);
    if (!fine) throw new NotFoundException('Multa no encontrada');
    return this.paymentsRepository.create({ fineId, teamId, receiptUrl, method: 'TRANSFER', amount: fine.amount });
  }

  async registerMatchPayment(dto: CreateMatchPaymentDto) {
    const status = dto.method === 'CASH' ? 'APPROVED' : 'PENDING';
    const payment = await this.paymentsRepository.create({
      matchId: dto.matchId,
      teamId: dto.teamId,
      tournamentId: dto.tournamentId,
      method: dto.method,
      amount: dto.amount,
      receiptUrl: dto.receiptUrl ?? null,
      status,
    });

    if (dto.method === 'CASH') {
      await this.finesRepository.markMatchFinesAsPaid(dto.teamId, dto.matchId);
      await this.balanceService.applyPayment({
        teamId: dto.teamId,
        tournamentId: dto.tournamentId,
        matchId: dto.matchId,
        paymentId: payment.id,
        amount: dto.amount,
      });
    }

    return payment;
  }

  findPending() {
    return this.paymentsRepository.findPending();
  }

  findByTeam(teamId: string) {
    return this.paymentsRepository.findByTeam(teamId);
  }

  findByMatch(matchId: string) {
    return this.paymentsRepository.findByMatch(matchId);
  }

  async review(
    paymentId: string,
    decision: 'APPROVED' | 'REJECTED',
    adminId: string,
    delegatePhone?: string | null,
    teamName?: string,
  ) {
    const payment = await this.paymentsRepository.findById(paymentId);
    if (!payment) throw new NotFoundException('Pago no encontrado');

    const updated = await this.paymentsRepository.review(paymentId, decision, adminId);

    if (decision === 'APPROVED') {
      if (payment.fineId) {
        await this.finesRepository.markAsPaid(payment.fineId);
      } else if (payment.matchId) {
        await this.finesRepository.markMatchFinesAsPaid(payment.teamId, payment.matchId);
      }

      if (payment.tournamentId && payment.matchId) {
        await this.balanceService.applyPayment({
          teamId: payment.teamId,
          tournamentId: payment.tournamentId,
          matchId: payment.matchId,
          paymentId: payment.id,
          amount: payment.amount,
        });
      }

      if (delegatePhone && teamName) {
        await this.whatsappService.sendText(
          delegatePhone,
          `✅ *Pago aprobado — ${teamName}*\n` +
          `Tu comprobante fue revisado y aprobado. La deuda está saldada.`,
        );
      }
    }

    return updated;
  }
}
