import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeaguesModule } from '../leagues/leagues.module';
import { RedisModule } from '../redis/redis.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, LeaguesModule, RedisModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
