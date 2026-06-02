import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentsService } from './tournaments.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(private tournamentsService: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  create(@Body() dto: CreateTournamentDto, @Req() req: Request) {
    const user = (req as any).user;
    const leagueId = user.leagueId as string;
    return this.tournamentsService.create(dto, leagueId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: Request) {
    const user = (req as any).user;
    const leagueId = (user?.leagueId ?? null) as string | null;
    return this.tournamentsService.findAll(leagueId);
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
}
