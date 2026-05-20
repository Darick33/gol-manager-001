import { FixtureMatch, TeamRecord, TournamentFormatStrategy } from './tournament-format.interface';

export class DirectEliminationFormat implements TournamentFormatStrategy {
  generateFixture(teams: TeamRecord[], tournamentId: string): FixtureMatch[] {
    // Only generates first round — subsequent rounds are created when matches finish
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const matches: FixtureMatch[] = [];
    const phaseName = `ROUND_OF_${shuffled.length}`;

    for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
      matches.push({
        tournamentId,
        homeTeamId: shuffled[i * 2].id,
        awayTeamId: shuffled[i * 2 + 1].id,
        phase: phaseName,
        stage: 1,
      });
    }

    return matches;
  }
}
