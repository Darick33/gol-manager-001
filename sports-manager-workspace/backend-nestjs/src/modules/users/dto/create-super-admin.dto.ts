import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateSuperAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
