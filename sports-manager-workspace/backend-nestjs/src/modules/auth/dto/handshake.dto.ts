import { IsString } from 'class-validator';

export class HandshakeDto {
  @IsString()
  token: string;
}
