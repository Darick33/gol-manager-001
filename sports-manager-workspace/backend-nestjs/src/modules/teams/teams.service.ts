import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsRepository } from './teams.repository';

@Injectable()
export class TeamsService {
  constructor(private teamsRepository: TeamsRepository) {}

  create(dto: CreateTeamDto) {
    return this.teamsRepository.create(dto);
  }

  findByTournament(tournamentId: string) {
    return this.teamsRepository.findByTournament(tournamentId);
  }

  async findById(id: string) {
    const team = await this.teamsRepository.findById(id);
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return team;
  }

  async update(id: string, data: Partial<CreateTeamDto>) {
    const team = await this.teamsRepository.findById(id);
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return this.teamsRepository.update(id, data);
  }
}
