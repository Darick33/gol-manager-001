import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '../../users/users.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  leagueId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safeUser } = user;
    // Grace window: tokens issued before multitenancy won't have leagueId.
    // Fall back to the user's current leagueId from DB, then null.
    const leagueId = payload.leagueId !== undefined
      ? (payload.leagueId ?? null)
      : (safeUser.leagueId ?? null);
    return { ...safeUser, leagueId };
  }
}
