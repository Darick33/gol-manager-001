import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { UsersRepository } from '../users/users.repository';
import { LeaguesRepository } from '../leagues/leagues.repository';
import { LoginDto } from './dto/login.dto';
import { HandshakeDto } from './dto/handshake.dto';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private leaguesRepository: LeaguesRepository,
    private jwtService: JwtService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async login(dto: LoginDto, subdomain?: string) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas');

    // Check league suspension for non-platform users
    if (user.leagueId) {
      const league = await this.leaguesRepository.findById(user.leagueId);
      if (league?.status === 'SUSPENDED') {
        throw new ForbiddenException('Liga suspendida');
      }
    }

    const leagueId = user.leagueId ?? null;
    const payload = { sub: user.id, email: user.email, role: user.role, leagueId };

    // Resolve active league for PLATFORM_ADMIN logging in on a league subdomain
    let activeLeagueId: string | null = null;
    if (user.role === 'PLATFORM_ADMIN' && subdomain) {
      const league = await this.leaguesRepository.findBySlug(subdomain);
      activeLeagueId = league?.id ?? null;
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, leagueId },
      activeLeagueId,
    };
  }

  async exchangeHandshake(dto: HandshakeDto) {
    let payload: { type?: string; sub: string; email?: string; leagueId?: string };
    try {
      payload = this.jwtService.verify(dto.token);
    } catch {
      throw new UnauthorizedException('Token inválido o ya usado');
    }

    if (payload.type !== 'handshake') {
      throw new UnauthorizedException('Token inválido o ya usado');
    }

    const hash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const stored = await this.redis.getdel(`handshake:${hash}`);

    if (!stored) {
      throw new UnauthorizedException('Token inválido o ya usado');
    }

    const [userId, leagueId] = stored.split(':');

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('Token inválido o ya usado');

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: 'PLATFORM_ADMIN',
      leagueId,
    };

    return {
      access_token: this.jwtService.sign(newPayload, { expiresIn: '8h' }),
      user: { id: user.id, name: user.name, email: user.email, role: 'PLATFORM_ADMIN', leagueId },
    };
  }
}
