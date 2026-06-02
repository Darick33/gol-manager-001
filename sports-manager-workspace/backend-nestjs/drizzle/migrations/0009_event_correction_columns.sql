-- match_events: soft-delete columns
ALTER TABLE "match_events" ADD COLUMN "cancelled_at" timestamp;
ALTER TABLE "match_events" ADD COLUMN "cancelled_by_id" uuid REFERENCES "users"("id");
ALTER TABLE "match_events" ADD COLUMN "cancel_reason" varchar(100);

-- fines: soft-delete column
ALTER TABLE "fines" ADD COLUMN "cancelled_at" timestamp;

-- indexes for active-only queries
CREATE INDEX "match_events_cancelled_at_idx" ON "match_events" ("cancelled_at") WHERE "cancelled_at" IS NULL;
CREATE INDEX "fines_cancelled_at_idx" ON "fines" ("cancelled_at") WHERE "fines"."cancelled_at" IS NULL;
