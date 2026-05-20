export interface TeamRecord {
  id: string;
  name: string;
}

export interface FixtureMatch {
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  phase: string;
  stage: number;
}

export interface TournamentFormatStrategy {
  generateFixture(teams: TeamRecord[], tournamentId: string): FixtureMatch[];
}
