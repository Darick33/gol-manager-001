import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, Min } from 'class-validator';

export class CreatePlayerDto {
  @IsUUID()
  teamId: string;

  @Transform(({ value }) => typeof value === 'string' ? value.normalize('NFC').trim() : value)
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @Max(99)
  dorsal: number;

  @IsUrl()
  @IsOptional()
  photoUrl?: string;
}
