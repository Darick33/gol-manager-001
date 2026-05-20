import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateFineDto } from './dto/create-fine.dto';
import { FinesService } from './fines.service';

@Controller('fines')
export class FinesController {
  constructor(private finesService: FinesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'VOCAL')
  create(@Body() dto: CreateFineDto) {
    return this.finesService.create(dto);
  }

  @Get('match/:matchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'VOCAL')
  findByMatch(@Param('matchId') matchId: string) {
    return this.finesService.findByMatch(matchId);
  }

  @Get('team/:teamId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'DELEGATE')
  findByTeam(@Param('teamId') teamId: string) {
    return this.finesService.findByTeam(teamId);
  }

  @Get('tournament/:tournamentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  findByTournament(@Param('tournamentId') tournamentId: string) {
    return this.finesService.findByTournament(tournamentId);
  }
}
