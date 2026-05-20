import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TeamsRepository } from '../teams/teams.repository';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayersRepository } from './players.repository';

@Injectable()
export class PlayersService {
  constructor(
    private playersRepository: PlayersRepository,
    private teamsRepository: TeamsRepository,
  ) {}

  async create(dto: CreatePlayerDto) {
    const team = await this.teamsRepository.findById(dto.teamId);
    if (!team) throw new NotFoundException('Equipo no encontrado');

    const players = await this.playersRepository.findByTeam(dto.teamId);
    const dorsalTaken = players.some((p) => p.dorsal === dto.dorsal);
    if (dorsalTaken) throw new BadRequestException(`El dorsal ${dto.dorsal} ya está asignado en este equipo`);

    return this.playersRepository.create(dto);
  }

  findByTeam(teamId: string) {
    return this.playersRepository.findByTeam(teamId);
  }

  async update(id: string, data: Partial<CreatePlayerDto>) {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return this.playersRepository.update(id, data);
  }

  async delete(id: string) {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return this.playersRepository.delete(id);
  }
}
