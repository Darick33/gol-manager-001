import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveLeague } from '../auth/decorators/active-league.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateVocalDto } from './dto/create-vocal.dto';
import { CreateDelegateDto } from './dto/create-delegate.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(
    @ActiveLeague() leagueId: string,
    @CurrentUser() user: { role: string },
  ) {
    return this.usersService.findByLeague(leagueId, user.role);
  }

  @Post('vocal')
  @HttpCode(HttpStatus.CREATED)
  createVocal(
    @Body() dto: CreateVocalDto,
    @ActiveLeague() leagueId: string,
  ) {
    return this.usersService.createVocal(dto, leagueId);
  }

  @Post('delegate')
  @HttpCode(HttpStatus.CREATED)
  createDelegate(
    @Body() dto: CreateDelegateDto,
    @ActiveLeague() leagueId: string,
  ) {
    return this.usersService.createDelegate(dto, leagueId);
  }

  @Post('super-admin')
  @Roles('PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  createSuperAdmin(
    @Body() dto: CreateSuperAdminDto,
    @ActiveLeague() leagueId: string,
  ) {
    return this.usersService.createSuperAdmin(dto, leagueId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @ActiveLeague() leagueId: string,
  ) {
    return this.usersService.updateActive(id, dto.active, leagueId);
  }
}
