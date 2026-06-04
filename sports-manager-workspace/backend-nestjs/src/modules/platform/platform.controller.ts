import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(private platformService: PlatformService) {}

  @Post('enter-league/:leagueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  enterLeague(
    @Param('leagueId') leagueId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.platformService.enterLeague(user.id, leagueId);
  }
}
