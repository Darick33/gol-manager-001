import { FixtureMatch, TeamRecord, TournamentFormatStrategy } from './tournament-format.interface';

export class RoundRobinFormat implements TournamentFormatStrategy {
  generateFixture(teams: TeamRecord[], tournamentId: string): FixtureMatch[] {
    const list = [...teams];
    if (list.length % 2 !== 0) list.push({ id: 'BYE', name: 'BYE' });

    const n = list.length;
    const matches: FixtureMatch[] = [];

    for (let round = 0; round < n - 1; round++) {
      for (let i = 0; i < n / 2; i++) {
        const home = list[i];
        const away = list[n - 1 - i];
        if (home.id !== 'BYE' && away.id !== 'BYE') {
          matches.push({
            tournamentId,
            homeTeamId: home.id,
            awayTeamId: away.id,
            phase: 'ROUND_ROBIN',
            stage: round + 1,
          });
        }
      }
      // rotate keeping first team fixed (Berger circle method)
      list.splice(1, 0, list.pop()!);
    }

    return matches;
  }
}
