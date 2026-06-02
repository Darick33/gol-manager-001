import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchEvent, Fine, Team, EventType } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmt(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

// ─── EventDot ─────────────────────────────────────────────────────────────────

export function EventDot({ type }: { type: EventType }) {
  if (type === 'GOAL')
    return (
      <div
        className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0"
        style={{ boxShadow: '0 0 5px rgba(74,222,128,0.6)' }}
      />
    );
  if (type === 'YELLOW_CARD')
    return (
      <div
        className="w-2 h-3 rounded-sm bg-yellow-400 shrink-0"
        style={{ boxShadow: '0 0 4px rgba(234,179,8,0.6)' }}
      />
    );
  if (type === 'RED_CARD')
    return (
      <div
        className="w-2 h-3 rounded-sm bg-red-500 shrink-0"
        style={{ boxShadow: '0 0 4px rgba(239,68,68,0.6)' }}
      />
    );
  if (type === 'FOUL')
    return (
      <div
        className="w-3 h-0.5 rounded-full bg-orange-400 shrink-0"
        style={{ boxShadow: '0 0 3px rgba(251,146,60,0.5)' }}
      />
    );
  return null;
}

// ─── EventLogGrid ─────────────────────────────────────────────────────────────

interface EventLogGridProps {
  events: MatchEvent[];
  homeTeamId: string;
  getPlayerName: (id: string | null) => string | null;
}

export function EventLogGrid({ events, homeTeamId, getPlayerName }: EventLogGridProps) {
  return (
    <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-y-3">
      <AnimatePresence initial={false}>
        {events.map((event) => {
          const isHome = event.teamId === homeTeamId;
          const playerName = getPlayerName(event.playerId);
          return (
            <Fragment key={event.id}>
              {isHome ? (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 justify-end"
                >
                  {playerName && (
                    <span className="text-xs text-gray-300 text-right truncate max-w-[90px]">
                      {playerName}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                    {event.minute}'
                  </span>
                  <EventDot type={event.eventType} />
                </motion.div>
              ) : (
                <div />
              )}
              <div className="flex justify-center">
                <div className="w-px h-full" />
              </div>
              {!isHome ? (
                <motion.div
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <EventDot type={event.eventType} />
                  <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                    {event.minute}'
                  </span>
                  {playerName && (
                    <span className="text-xs text-gray-300 truncate max-w-[90px]">{playerName}</span>
                  )}
                </motion.div>
              ) : (
                <div />
              )}
            </Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── HalfFinesSection ─────────────────────────────────────────────────────────

interface HalfFinesSectionProps {
  label: string;
  fines: Fine[];
  total: number;
  teamName: (id: string) => string | undefined;
}

export function HalfFinesSection({ label, fines, total, teamName }: HalfFinesSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-[9px] font-bold text-gray-600 tabular-nums">{fmt(total)}</span>
      </div>
      {fines.length === 0 ? (
        <p className="text-xs text-gray-700 pl-1">Sin multas</p>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {fines.map((fine) => (
              <motion.div
                key={fine.id}
                initial={{ x: 12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-start gap-2 bg-gray-900/70 rounded-lg px-3 py-2.5 min-h-[40px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-amber-200/80 truncate">
                    {teamName(fine.teamId) ?? 'Equipo'}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{fine.reason}</p>
                </div>
                <span className="text-xs font-bold text-amber-300 tabular-nums whitespace-nowrap shrink-0">
                  {fmt(fine.amount)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── FinesPanel ───────────────────────────────────────────────────────────────

interface FinesPanelProps {
  half1Fines: Fine[];
  half2Fines: Fine[];
  half1Total: number;
  half2Total: number;
  totalFines: number;
  teamName: (id: string) => string | undefined;
}

export function FinesPanel({
  half1Fines,
  half2Fines,
  half1Total,
  half2Total,
  totalFines,
  teamName,
}: FinesPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <HalfFinesSection label="1er Tiempo" fines={half1Fines} total={half1Total} teamName={teamName} />
      <HalfFinesSection label="2do Tiempo" fines={half2Fines} total={half2Total} teamName={teamName} />
      <div className="border-t border-gray-800 pt-3 mt-auto">
        <div className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total partido</span>
          <span className="text-lg font-black text-amber-300 tabular-nums">{fmt(totalFines)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── EventButtons ─────────────────────────────────────────────────────────────

interface EventButtonsProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeTeamId: string;
  awayTeamId: string;
  homeColor: string;
  awayColor: string;
  onEvent: (type: EventType, teamId: string) => void;
}

export function EventButtons({
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  homeColor,
  awayColor,
  onEvent,
}: EventButtonsProps) {
  return (
    <div className="space-y-4">
      {[
        { team: homeTeam, id: homeTeamId, color: homeColor },
        { team: awayTeam, id: awayTeamId, color: awayColor },
      ].map(({ team, id, color }) => (
        <div key={id}>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color }}
          >
            {team?.name ?? 'Equipo'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'FOUL'] as EventType[]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => onEvent(type, id)}
                  className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 hover:border-gray-600 rounded-xl py-3 min-h-[44px] px-3 text-xs font-medium transition-all"
                >
                  {type === 'GOAL'
                    ? '⚽ Gol'
                    : type === 'YELLOW_CARD'
                    ? '🟨 Amarilla'
                    : type === 'RED_CARD'
                    ? '🟥 Roja'
                    : type === 'SUBSTITUTION'
                    ? '🔄 Cambio'
                    : '⚡ Falta'}
                </button>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
