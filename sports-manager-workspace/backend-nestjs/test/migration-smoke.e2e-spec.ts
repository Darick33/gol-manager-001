/**
 * T19 — Migration smoke test
 *
 * Verifies that the migration SQL files contain the required statements
 * to guarantee: no orphan tournaments (all assigned to Liga Piloto),
 * and the Liga Piloto row is seeded.
 *
 * This runs as a file-level unit test (no live DB needed). Integration
 * tests against a real DB should run in CI with a test database.
 */
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../drizzle/migrations');
const PILOTO_UUID = '00000000-0000-0000-0000-000000000001';

function readMigration(filename: string): string {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Migration file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

describe('Migration smoke tests — liga-multitenancy', () => {
  let sql0006: string;
  let sql0007: string;

  beforeAll(() => {
    sql0006 = readMigration('0006_platform_admin_enum.sql');
    sql0007 = readMigration('0007_leagues_multitenancy.sql');
  });

  describe('0006 — PLATFORM_ADMIN enum', () => {
    it('adds PLATFORM_ADMIN to user_role enum', () => {
      expect(sql0006).toMatch(/ADD VALUE.*PLATFORM_ADMIN/i);
    });
  });

  describe('0007 — leagues table + data migration', () => {
    it('creates the leagues table', () => {
      expect(sql0007).toMatch(/CREATE TABLE.*leagues/i);
    });

    it('inserts Liga Piloto with deterministic UUID', () => {
      expect(sql0007).toContain(PILOTO_UUID);
    });

    it('adds league_id column to tournaments', () => {
      expect(sql0007).toMatch(/ALTER TABLE.*tournaments.*ADD COLUMN.*league_id/i);
    });

    it('backfills all tournaments to Liga Piloto (UPDATE with SET league_id)', () => {
      // The UPDATE must assign PILOTO_UUID to every tournament row
      expect(sql0007).toMatch(/UPDATE.*tournaments.*SET.*league_id/is);
      expect(sql0007).toContain(PILOTO_UUID);
    });

    it('makes tournaments.league_id NOT NULL after backfill', () => {
      // Uses multiline/dotAll so it matches across newlines in the SQL file
      expect(sql0007).toMatch(/ALTER TABLE[\s\S]*?tournaments[\s\S]*?ALTER COLUMN[\s\S]*?league_id[\s\S]*?NOT NULL/i);
    });

    it('adds league_id column to users', () => {
      expect(sql0007).toMatch(/ALTER TABLE.*users.*ADD COLUMN.*league_id/i);
    });

    it('creates composite unique index on tournaments(slug, league_id)', () => {
      expect(sql0007).toMatch(/UNIQUE INDEX.*tournaments.*slug.*league_id|CREATE UNIQUE INDEX.*slug.*league/i);
    });
  });
});
