import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueStatusDto } from './dto/update-league-status.dto';
import { LeaguesService } from './leagues.service';

@Controller('leagues')
export class LeaguesController {
  constructor(private leaguesService: LeaguesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  create(@Body() dto: CreateLeagueDto) {
    return this.leaguesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  findAll() {
    return this.leaguesService.findAll();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeagueStatusDto) {
    return this.leaguesService.updateStatus(id, dto.status);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.leaguesService.findBySlug(slug);
  }
}
