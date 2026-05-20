import { IsOptional, IsString, IsUrl, IsUUID, Matches } from 'class-validator';

const HEX_COLOR = /^#([A-Fa-f0-9]{6})$/;

export class CreateTeamDto {
  @IsUUID()
  tournamentId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(HEX_COLOR, { message: 'primaryColor debe ser un color hex válido (#RRGGBB)' })
  primaryColor?: string;

  @IsString()
  @IsOptional()
  @Matches(HEX_COLOR, { message: 'secondaryColor debe ser un color hex válido (#RRGGBB)' })
  secondaryColor?: string;

  @IsUUID()
  @IsOptional()
  delegateId?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}
