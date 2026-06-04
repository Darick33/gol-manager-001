import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeagueDto } from './dto/create-league.dto';
import { LeaguesRepository } from './leagues.repository';

@Injectable()
export class LeaguesService {
  constructor(private leaguesRepository: LeaguesRepository) {}

  async create(dto: CreateLeagueDto) {
    const existing = await this.leaguesRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`El slug "${dto.slug}" ya está en uso por otra liga`);
    }
    return this.leaguesRepository.create({
      name: dto.name,
      slug: dto.slug,
      subdomain: dto.subdomain,
      logoUrl: dto.logoUrl,
    });
  }

  findAll() {
    return this.leaguesRepository.findAll();
  }

  async findById(id: string) {
    const league = await this.leaguesRepository.findById(id);
    if (!league) throw new NotFoundException('Liga no encontrada');
    return league;
  }

  async findBySlug(slug: string) {
    const league = await this.leaguesRepository.findBySlug(slug);
    if (!league) throw new NotFoundException('Liga no encontrada');
    return league;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    const league = await this.leaguesRepository.updateStatus(id, status);
    if (!league) throw new NotFoundException('Liga no encontrada');
    return league;
  }
}
