import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// teamId assignment deferred — requires cross-tournament validation (future PR)
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
}
