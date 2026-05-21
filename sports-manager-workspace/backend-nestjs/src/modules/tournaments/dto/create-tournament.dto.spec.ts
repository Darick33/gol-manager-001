import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTournamentDto } from './create-tournament.dto';

const validBase = {
  name: 'Copa Test',
  sportType: 'FOOTBALL',
  format: 'ROUND_ROBIN',
  halfDurationMinutes: 45,
  maxRosterSize: 15,
};

describe('CreateTournamentDto', () => {
  it('accepts yellowCardFine as a decimal (e.g. 0.5)', async () => {
    const dto = plainToInstance(CreateTournamentDto, { ...validBase, yellowCardFine: 0.5 });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'yellowCardFine')).toHaveLength(0);
  });

  it('accepts refereeFeeEnabled as a boolean', async () => {
    const dto = plainToInstance(CreateTournamentDto, { ...validBase, refereeFeeEnabled: false });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'refereeFeeEnabled')).toHaveLength(0);
  });

  it('rejects refereeFeeEnabled when not a boolean', async () => {
    const dto = plainToInstance(CreateTournamentDto, { ...validBase, refereeFeeEnabled: 'yes' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'refereeFeeEnabled').length).toBeGreaterThan(0);
  });
});
