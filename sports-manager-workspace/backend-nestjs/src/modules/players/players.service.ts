import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TeamsRepository } from '../teams/teams.repository';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayersRepository } from './players.repository';

interface CallerUser { id: string; role: string }

@Injectable()
export class PlayersService {
  constructor(
    private playersRepository: PlayersRepository,
    private teamsRepository: TeamsRepository,
  ) {}

  async create(dto: CreatePlayerDto, caller: CallerUser) {
    const team = await this.teamsRepository.findById(dto.teamId);
    if (!team) throw new NotFoundException('Equipo no encontrado');

    if (caller.role === 'DELEGATE' && team.delegateId !== caller.id) {
      throw new ForbiddenException('Solo podés agregar jugadores a tu propio equipo');
    }

    const players = await this.playersRepository.findByTeam(dto.teamId);
    const dorsalTaken = players.some((p) => p.dorsal === dto.dorsal);
    if (dorsalTaken) throw new BadRequestException(`El dorsal ${dto.dorsal} ya está asignado en este equipo`);

    return this.playersRepository.create(dto);
  }

  findByTeam(teamId: string) {
    return this.playersRepository.findByTeam(teamId);
  }

  async update(id: string, data: Partial<CreatePlayerDto>, caller: CallerUser) {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException('Jugador no encontrado');

    if (caller.role === 'DELEGATE') {
      const team = await this.teamsRepository.findById(player.teamId);
      if (!team || team.delegateId !== caller.id) {
        throw new ForbiddenException('Solo podés modificar jugadores de tu propio equipo');
      }
    }

    return this.playersRepository.update(id, data);
  }

  async delete(id: string) {
    const player = await this.playersRepository.findById(id);
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return this.playersRepository.delete(id);
  }
}
