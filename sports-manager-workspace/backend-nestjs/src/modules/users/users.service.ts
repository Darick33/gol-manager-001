import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateVocalDto } from './dto/create-vocal.dto';
import { CreateDelegateDto } from './dto/create-delegate.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findByLeague(leagueId: string, callerRole: string) {
    if (!leagueId) {
      throw new BadRequestException('Se requiere contexto de liga (X-Active-League-Id)');
    }
    const roles =
      callerRole === 'PLATFORM_ADMIN'
        ? ['VOCAL', 'DELEGATE', 'SUPER_ADMIN']
        : ['VOCAL', 'DELEGATE'];
    return this.usersRepository.findByLeague(leagueId, roles);
  }

  async createVocal(dto: CreateVocalDto, leagueId: string) {
    if (!leagueId) {
      throw new BadRequestException('Se requiere contexto de liga (X-Active-League-Id)');
    }
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
    if (!leagueId) {
      throw new BadRequestException('Se requiere contexto de liga (X-Active-League-Id)');
    }
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

  async createSuperAdmin(dto: CreateSuperAdminDto, leagueId: string) {
    if (!leagueId) {
      throw new BadRequestException('Se requiere contexto de liga (X-Active-League-Id)');
    }
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'SUPER_ADMIN',
      leagueId,
    });
  }

  async updateActive(userId: string, active: boolean, leagueId: string) {
    if (!leagueId) {
      throw new BadRequestException('Se requiere contexto de liga (X-Active-League-Id)');
    }
    return this.usersRepository.updateActive(userId, active, leagueId);
  }
}
