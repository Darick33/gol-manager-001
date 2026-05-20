import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'VOCAL', 'DELEGATE']);
export const tournamentFormatEnum = pgEnum('tournament_format', ['ROUND_ROBIN', 'GROUPS_ELIMINATION', 'DIRECT_ELIMINATION']);
export const sportTypeEnum = pgEnum('sport_type', ['FOOTBALL', 'FUTSAL']);
export const tournamentStatusEnum = pgEnum('tournament_status', ['DRAFT', 'ACTIVE', 'FINISHED']);
export const matchStatusEnum = pgEnum('match_status', ['SCHEDULED', 'IN_PROGRESS', 'FINISHED']);
export const eventTypeEnum = pgEnum('event_type', ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'FOUL']);
export const fineStatusEnum = pgEnum('fine_status', ['PENDING', 'PAID']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  sportType: sportTypeEnum('sport_type').notNull(),
  format: tournamentFormatEnum('format').notNull(),
  halfDurationMinutes: integer('half_duration_minutes').notNull(),
  maxRosterSize: integer('max_roster_size').notNull(),
  category: varchar('category', { length: 100 }),
  status: tournamentStatusEnum('status').default('DRAFT').notNull(),
  yellowCardFine: integer('yellow_card_fine').default(2000).notNull(),
  redCardFine: integer('red_card_fine').default(5000).notNull(),
  lateFine: integer('late_fine').default(10000).notNull(),
  courtFee: integer('court_fee').default(0).notNull(),
  refereeFee: integer('referee_fee').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }),
  secondaryColor: varchar('secondary_color', { length: 7 }),
  delegateId: uuid('delegate_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 255 }).notNull(),
  dorsal: integer('dorsal').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id),
  homeTeamId: uuid('home_team_id').notNull().references(() => teams.id),
  awayTeamId: uuid('away_team_id').notNull().references(() => teams.id),
  vocalId: uuid('vocal_id').references(() => users.id),
  phase: varchar('phase', { length: 50 }),
  stage: integer('stage'),
  scheduledAt: timestamp('scheduled_at'),
  status: matchStatusEnum('status').default('SCHEDULED').notNull(),
  timerSeconds: integer('timer_seconds').default(0),
  timerRunning: boolean('timer_running').default(false),
  currentHalf: integer('current_half').default(1),
  homeScore: integer('home_score').default(0),
  awayScore: integer('away_score').default(0),
  homeTeamColor: varchar('home_team_color', { length: 7 }),
  awayTeamColor: varchar('away_team_color', { length: 7 }),
  actaPdfUrl: text('acta_pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const matchEvents = pgTable('match_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull().references(() => matches.id),
  teamId: uuid('team_id').notNull().references(() => teams.id),
  playerId: uuid('player_id').references(() => players.id),
  playerOutId: uuid('player_out_id').references(() => players.id),
  eventType: eventTypeEnum('event_type').notNull(),
  minute: integer('minute').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fines = pgTable('fines', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id),
  tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id),
  matchId: uuid('match_id').references(() => matches.id),
  matchEventId: uuid('match_event_id').references(() => matchEvents.id),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  half: integer('half').default(1).notNull(),
  status: fineStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  fineId: uuid('fine_id').notNull().references(() => fines.id),
  teamId: uuid('team_id').notNull().references(() => teams.id),
  receiptUrl: text('receipt_url').notNull(),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
