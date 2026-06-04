import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeaguesModule } from '../leagues/leagues.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, LeaguesModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
