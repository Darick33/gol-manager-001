import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateFineDto {
  @IsUUID()
  teamId: string;

  @IsUUID()
  tournamentId: string;

  @IsUUID()
  @IsOptional()
  matchId?: string;

  @IsUUID()
  @IsOptional()
  matchEventId?: string;

  @IsInt()
  @Min(0)
  amount: number;

  @IsString()
  reason: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  half?: number;
}
