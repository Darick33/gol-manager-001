import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateVocalDto } from './dto/create-vocal.dto';
import { CreateDelegateDto } from './dto/create-delegate.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findByLeague(leagueId: string) {
    return this.usersRepository.findByLeague(leagueId, ['VOCAL', 'DELEGATE']);
  }

  async createVocal(dto: CreateVocalDto, leagueId: string) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'VOCAL',
      leagueId,
    });
  }

  async createDelegate(dto: CreateDelegateDto, leagueId: string) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'DELEGATE',
      leagueId,
      whatsappNumber: dto.whatsappNumber ?? null,
    });
  }

  async updateActive(userId: string, active: boolean, leagueId: string) {
    return this.usersRepository.updateActive(userId, active, leagueId);
  }
}
