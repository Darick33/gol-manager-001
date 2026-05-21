import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

  @IsNumber()
  @Min(0)
  @IsOptional()
  yellowCardFine?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  redCardFine?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lateFine?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  courtFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refereeFee?: number;

  @IsBoolean()
  @IsOptional()
  refereeFeeEnabled?: boolean;
}
