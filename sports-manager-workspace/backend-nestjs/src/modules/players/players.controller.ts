import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'DELEGATE')
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.playersService.findByTeam(teamId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'DELEGATE')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePlayerDto>) {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  delete(@Param('id') id: string) {
    return this.playersService.delete(id);
  }
}
