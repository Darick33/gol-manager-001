import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RegisterEventDto {
  @IsUUID()
  matchId: string;

  @IsUUID()
  teamId: string;

  @IsUUID()
  @IsOptional()
  playerId?: string;

  @IsUUID()
  @IsOptional()
  playerOutId?: string;

  @IsEnum(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'])
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';

  @IsInt()
  @Min(0)
  minute: number;
}
