-- 1. Tabla leagues
CREATE TABLE "leagues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "subdomain" varchar(100),
  "logo_url" text,
  "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "leagues_slug_unique_idx" ON "leagues" ("slug");

-- 2. Liga Piloto con UUID fijo
INSERT INTO "leagues" ("id", "name", "slug", "subdomain", "status")
VALUES ('00000000-0000-0000-0000-000000000001', 'Mi Liga', 'piloto', 'piloto', 'ACTIVE');

-- 3. tournaments: agregar league_id nullable primero
ALTER TABLE "tournaments" ADD COLUMN "league_id" uuid;

-- 4. Backfill tournaments
UPDATE "tournaments" SET "league_id" = '00000000-0000-0000-0000-000000000001';

-- 5. SET NOT NULL
ALTER TABLE "tournaments" ALTER COLUMN "league_id" SET NOT NULL;

-- 6. FK constraint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_league_id_fk"
  FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE RESTRICT;

-- 7. Drop old unique on tournaments.slug, crear composite
ALTER TABLE "tournaments" DROP CONSTRAINT IF EXISTS "tournaments_slug_unique";
CREATE UNIQUE INDEX "tournaments_slug_league_idx" ON "tournaments" ("slug", "league_id");

-- 8. users: agregar league_id nullable (null = PLATFORM_ADMIN)
ALTER TABLE "users" ADD COLUMN "league_id" uuid;

-- 9. Backfill users (todos los existentes van a la Liga Piloto)
UPDATE "users" SET "league_id" = '00000000-0000-0000-0000-000000000001'
WHERE "role" != 'PLATFORM_ADMIN';

-- 10. FK constraint (nullable, sin NOT NULL)
ALTER TABLE "users" ADD CONSTRAINT "users_league_id_fk"
  FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL;

-- 11. Index en league_id para joins
CREATE INDEX "tournaments_league_id_idx" ON "tournaments" ("league_id");
CREATE INDEX "users_league_id_idx" ON "users" ("league_id");
