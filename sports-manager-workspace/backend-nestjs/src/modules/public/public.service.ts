import { Injectable } from '@nestjs/common';
import { PublicRepository } from './public.repository';

@Injectable()
export class PublicService {
  constructor(private publicRepository: PublicRepository) {}

  getActiveTournaments() {
    return this.publicRepository.getActiveTournaments();
  }

  async getTournamentBySlug(slug: string) {
    const tournament = await this.publicRepository.getTournamentBySlug(slug);
    if (!tournament) return null;
    const teams = await this.publicRepository.getTeamsByTournament(tournament.id);
    return { ...tournament, teams };
  }

  async getMatchesBySlug(slug: string) {
    const tournament = await this.publicRepository.getTournamentBySlug(slug);
    if (!tournament) return null;

    const [matches, teams] = await Promise.all([
      this.publicRepository.getMatchesByTournament(tournament.id),
      this.publicRepository.getTeamsByTournament(tournament.id),
    ]);

    const teamMap = new Map(teams.map((t) => [t.id, t]));

    return matches
      .map((m) => ({
        id: m.id,
        status: m.status,
        scheduledAt: m.scheduledAt,
        stage: m.stage,
        phase: m.phase,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        timerSeconds: m.timerSeconds,
        timerRunning: m.timerRunning,
        currentHalf: m.currentHalf,
        actaPdfUrl: m.actaPdfUrl,
        homeTeam: {
          id: m.homeTeamId,
          name: teamMap.get(m.homeTeamId)?.name ?? 'Equipo',
          logoUrl: teamMap.get(m.homeTeamId)?.logoUrl ?? null,
          primaryColor: teamMap.get(m.homeTeamId)?.primaryColor ?? null,
        },
        awayTeam: {
          id: m.awayTeamId,
          name: teamMap.get(m.awayTeamId)?.name ?? 'Equipo',
          logoUrl: teamMap.get(m.awayTeamId)?.logoUrl ?? null,
          primaryColor: teamMap.get(m.awayTeamId)?.primaryColor ?? null,
        },
      }))
      .sort((a, b) => {
        if (a.stage !== null && b.stage !== null) return a.stage - b.stage;
        if (a.scheduledAt && b.scheduledAt)
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        return 0;
      });
  }

  async getStandingsBySlug(slug: string) {
    const tournament = await this.publicRepository.getTournamentBySlug(slug);
    if (!tournament) return null;

    const [teams, finishedMatches] = await Promise.all([
      this.publicRepository.getTeamsByTournament(tournament.id),
      this.publicRepository.getFinishedMatchesByTournament(tournament.id),
    ]);

    const stats = new Map<string, { w: number; d: number; l: number; gf: number; ga: number }>();
    for (const t of teams) stats.set(t.id, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });

    for (const m of finishedMatches) {
      const home = stats.get(m.homeTeamId);
      const away = stats.get(m.awayTeamId);
      if (!home || !away) continue;

      const hg = m.homeScore ?? 0;
      const ag = m.awayScore ?? 0;
      home.gf += hg; home.ga += ag;
      away.gf += ag; away.ga += hg;

      if (hg > ag)      { home.w++; away.l++; }
      else if (hg < ag) { away.w++; home.l++; }
      else              { home.d++; away.d++; }
    }

    return teams
      .map((t) => {
        const s = stats.get(t.id)!;
        const points = s.w * 3 + s.d;
        return {
          team: t,
          played: s.w + s.d + s.l,
          won: s.w,
          drawn: s.d,
          lost: s.l,
          goalsFor: s.gf,
          goalsAgainst: s.ga,
          goalDifference: s.gf - s.ga,
          points,
        };
      })
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor,
      );
  }

  async getScorersByTournamentId(tournamentId: string) {
    const matchRows = await this.publicRepository.getMatchIdsByTournament(tournamentId);
    if (!matchRows.length) return [];

    const matchIds = matchRows.map((m) => m.id);
    const goalEvents = await this.publicRepository.getGoalEventsByMatches(matchIds);
    if (!goalEvents.length) return [];

    const goalMap = new Map<string, { teamId: string; goals: number }>();
    for (const e of goalEvents) {
      if (!e.playerId) continue;
      const prev = goalMap.get(e.playerId);
      goalMap.set(e.playerId, { teamId: e.teamId, goals: (prev?.goals ?? 0) + 1 });
    }

    const playerIds = [...goalMap.keys()];
    if (!playerIds.length) return [];

    const teamIds = [...new Set([...goalMap.values()].map((v) => v.teamId))];

    const [players, teams] = await Promise.all([
      this.publicRepository.getPlayersByIds(playerIds),
      this.publicRepository.getTeamsByIds(teamIds),
    ]);

    const teamMap = new Map(teams.map((t) => [t.id, t]));

    return players
      .map((p) => ({
        player: { id: p.id, name: p.name, dorsal: p.dorsal, photoUrl: p.photoUrl },
        team: teamMap.get(goalMap.get(p.id)?.teamId ?? '') ?? { id: p.teamId, name: 'Equipo', logoUrl: null, primaryColor: null },
        goals: goalMap.get(p.id)?.goals ?? 0,
      }))
      .sort((a, b) => b.goals - a.goals);
  }

  async getScorersBySlug(slug: string) {
    const tournament = await this.publicRepository.getTournamentBySlug(slug);
    if (!tournament) return null;
    return this.getScorersByTournamentId(tournament.id);
  }

  async getLiveMatches() {
    const liveMatches = await this.publicRepository.getLiveMatches();
    if (!liveMatches.length) return [];

    const teamIds = [
      ...new Set([
        ...liveMatches.map((m) => m.homeTeamId),
        ...liveMatches.map((m) => m.awayTeamId),
      ]),
    ];

    const teams = await this.publicRepository.getTeamsByIds(teamIds);
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    return liveMatches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      status: m.status,
      scheduledAt: m.scheduledAt,
      stage: m.stage,
      phase: m.phase,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      timerSeconds: m.timerSeconds,
      timerRunning: m.timerRunning,
      currentHalf: m.currentHalf,
      homeTeam: {
        id: m.homeTeamId,
        name: teamMap.get(m.homeTeamId)?.name ?? 'Equipo',
        logoUrl: teamMap.get(m.homeTeamId)?.logoUrl ?? null,
        primaryColor: teamMap.get(m.homeTeamId)?.primaryColor ?? null,
      },
      awayTeam: {
        id: m.awayTeamId,
        name: teamMap.get(m.awayTeamId)?.name ?? 'Equipo',
        logoUrl: teamMap.get(m.awayTeamId)?.logoUrl ?? null,
        primaryColor: teamMap.get(m.awayTeamId)?.primaryColor ?? null,
      },
    }));
  }
}
