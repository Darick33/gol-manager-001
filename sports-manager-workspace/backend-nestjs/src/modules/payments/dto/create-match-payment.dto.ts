import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMatchPaymentDto {
  @IsUUID()
  matchId: string;

  @IsUUID()
  teamId: string;

  @IsUUID()
  tournamentId: string;

  @IsEnum(['CASH', 'TRANSFER'])
  method: 'CASH' | 'TRANSFER';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}
