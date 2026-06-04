import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDelegateDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  // TODO: validate teamId belongs to the active league at service level
  @IsOptional()
  @IsString()
  teamId?: string;
}
