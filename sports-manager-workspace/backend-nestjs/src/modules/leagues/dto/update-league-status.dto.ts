import { IsIn } from 'class-validator';

export class UpdateLeagueStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'SUSPENDED';
}
