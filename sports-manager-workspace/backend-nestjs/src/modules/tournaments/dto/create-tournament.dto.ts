import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsEnum(['FOOTBALL', 'FUTSAL'])
  sportType: 'FOOTBALL' | 'FUTSAL';

  @IsEnum(['ROUND_ROBIN', 'GROUPS_ELIMINATION', 'DIRECT_ELIMINATION'])
  format: 'ROUND_ROBIN' | 'GROUPS_ELIMINATION' | 'DIRECT_ELIMINATION';

  @IsInt()
  @Min(1)
  halfDurationMinutes: number;

  @IsInt()
  @Min(1)
  maxRosterSize: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  yellowCardFine?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  redCardFine?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  lateFine?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  courtFee?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  refereeFee?: number;
}
