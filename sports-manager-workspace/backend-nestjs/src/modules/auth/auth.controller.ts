import { Body, Controller, Headers, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { HandshakeDto } from './dto/handshake.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto, @Headers('x-league-subdomain') subdomain?: string) {
    return this.authService.login(dto, subdomain);
  }

  @Public()
  @Post('handshake')
  handshake(@Body() dto: HandshakeDto) {
    return this.authService.exchangeHandshake(dto);
  }
}
