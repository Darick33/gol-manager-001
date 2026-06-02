import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentsService } from './tournaments.service';
import { SuspensionsService } from '../matches/suspensions.service';

interface AuthUser {
  id: string;
  role: string;
  leagueId: string | null;
}

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private tournamentsService: TournamentsService,
    private suspensionsService: SuspensionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  create(@Body() dto: CreateTournamentDto, @CurrentUser() user: AuthUser) {
    return this.tournamentsService.create(dto, user.leagueId as string);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: AuthUser) {
    return this.tournamentsService.findAll(user?.leagueId ?? null);
  }

  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.tournamentsService.findById(id);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tournamentsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreateTournamentDto>) {
    return this.tournamentsService.update(id, dto);
  }

  @Post(':id/fixture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  generateFixture(@Param('id') id: string) {
    return this.tournamentsService.generateFixture(id);
  }

  @Get(':id/suspensions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  getSuspensions(@Param('id') id: string) {
    return this.suspensionsService.findPendingByTournament(id);
  }

  @Delete(':id/suspensions/:suspensionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  cancelSuspension(@Param('suspensionId') suspensionId: string) {
    return this.suspensionsService.cancel(suspensionId);
  }
}
