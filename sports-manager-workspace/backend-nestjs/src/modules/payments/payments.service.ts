import { Injectable, NotFoundException } from '@nestjs/common';
import { FinesRepository } from '../fines/fines.repository';
import { WhatsappService } from '../notifications/whatsapp.service';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private finesRepository: FinesRepository,
    private whatsappService: WhatsappService,
  ) {}

  async uploadReceipt(fineId: string, teamId: string, receiptUrl: string) {
    const fine = await this.finesRepository.findById(fineId);
    if (!fine) throw new NotFoundException('Multa no encontrada');
    return this.paymentsRepository.create({ fineId, teamId, receiptUrl });
  }

  findPending() {
    return this.paymentsRepository.findPending();
  }

  findByTeam(teamId: string) {
    return this.paymentsRepository.findByTeam(teamId);
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
      await this.finesRepository.markAsPaid(payment.fineId);

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
