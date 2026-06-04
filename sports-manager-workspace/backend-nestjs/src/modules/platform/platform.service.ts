import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { LeaguesRepository } from '../leagues/leagues.repository';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class PlatformService {
  constructor(
    private jwtService: JwtService,
    private leaguesRepository: LeaguesRepository,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async enterLeague(userId: string, leagueId: string): Promise<{ handshake_token: string }> {
    const league = await this.leaguesRepository.findById(leagueId);
    if (!league) {
      throw new NotFoundException('Liga no encontrada');
    }

    if (league.status === 'SUSPENDED') {
      throw new ForbiddenException('Liga suspendida');
    }

    const token = this.jwtService.sign(
      { type: 'handshake', leagueId, sub: userId },
      { expiresIn: '5m' },
    );

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.set(`handshake:${hash}`, `${userId}:${leagueId}`, 'EX', 300, 'NX');

    return { handshake_token: token };
  }
}
