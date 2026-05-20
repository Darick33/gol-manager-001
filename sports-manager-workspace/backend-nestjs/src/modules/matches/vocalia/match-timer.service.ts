import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { MatchesRepository } from '../matches.repository';

interface TimerState {
  seconds: number;
  currentHalf: number;
  halfDurationSeconds: number;
  interval?: ReturnType<typeof setInterval>;
}

@Injectable()
export class MatchTimerService implements OnModuleInit, OnModuleDestroy {
  private server: Server;
  private timers = new Map<string, TimerState>();

  constructor(private matchesRepository: MatchesRepository) {}

  async onModuleInit() {
    // Recover any IN_PROGRESS matches on server restart
    const active = await this.matchesRepository.findInProgress();
    for (const match of active) {
      await this.matchesRepository.updateTimer(match.id, match.timerSeconds ?? 0, false, match.currentHalf ?? 1);
    }
  }

  onModuleDestroy() {
    this.timers.forEach((state) => clearInterval(state.interval));
  }

  setServer(server: Server) {
    this.server = server;
  }

  start(matchId: string, halfDurationMinutes: number, currentHalf: number, startSeconds = 0) {
    if (this.timers.has(matchId)) return;

    const state: TimerState = {
      seconds: startSeconds,
      currentHalf,
      halfDurationSeconds: halfDurationMinutes * 60,
    };

    state.interval = setInterval(async () => {
      state.seconds++;

      this.server?.to(`match:${matchId}`).emit('timer_tick', {
        seconds: state.seconds,
        currentHalf: state.currentHalf,
        running: true,
      });

      // Persist every 10 seconds to avoid DB hammering
      if (state.seconds % 10 === 0) {
        await this.matchesRepository.updateTimer(matchId, state.seconds, true, state.currentHalf);
      }

      // Auto-pause when half time is reached
      if (state.seconds >= state.halfDurationSeconds) {
        this.pause(matchId);
        this.server?.to(`match:${matchId}`).emit('half_ended', {
          currentHalf: state.currentHalf,
          totalSeconds: state.seconds,
        });
        await this.matchesRepository.updateTimer(matchId, state.seconds, false, state.currentHalf);
      }
    }, 1000);

    this.timers.set(matchId, state);
  }

  pause(matchId: string) {
    const state = this.timers.get(matchId);
    if (!state) return;
    clearInterval(state.interval);
    state.interval = undefined;
    this.timers.set(matchId, state);
  }

  resume(matchId: string, halfDurationMinutes: number, nextHalf: number) {
    const state = this.timers.get(matchId);
    const currentSeconds = state?.seconds ?? 0;
    this.timers.delete(matchId);
    this.start(matchId, halfDurationMinutes, nextHalf, 0);
    return currentSeconds;
  }

  stop(matchId: string) {
    const state = this.timers.get(matchId);
    if (state) {
      clearInterval(state.interval);
      this.timers.delete(matchId);
    }
  }

  getCurrentSeconds(matchId: string): number {
    return this.timers.get(matchId)?.seconds ?? 0;
  }
}
