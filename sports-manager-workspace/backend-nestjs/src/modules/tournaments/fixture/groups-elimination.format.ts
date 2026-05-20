import { FixtureMatch, TeamRecord, TournamentFormatStrategy } from './tournament-format.interface';
import { RoundRobinFormat } from './round-robin.format';

const TEAMS_PER_GROUP = 4;

export class GroupsEliminationFormat implements TournamentFormatStrategy {
  generateFixture(teams: TeamRecord[], tournamentId: string): FixtureMatch[] {
    const groups = this.splitIntoGroups(teams);
    const roundRobin = new RoundRobinFormat();
    const matches: FixtureMatch[] = [];

    groups.forEach((group, index) => {
      const groupLabel = String.fromCharCode(65 + index); // A, B, C...
      const groupMatches = roundRobin.generateFixture(group, tournamentId);
      groupMatches.forEach((m) =>
        matches.push({ ...m, phase: `GROUP_${groupLabel}` }),
      );
    });

    return matches;
  }

  private splitIntoGroups(teams: TeamRecord[]): TeamRecord[][] {
    const groups: TeamRecord[][] = [];
    for (let i = 0; i < teams.length; i += TEAMS_PER_GROUP) {
      groups.push(teams.slice(i, i + TEAMS_PER_GROUP));
    }
    return groups;
  }
}
