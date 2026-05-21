ALTER TYPE "public"."event_type" ADD VALUE 'FOUL';--> statement-breakpoint
ALTER TABLE "fines" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "yellow_card_fine" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "yellow_card_fine" SET DEFAULT 2000;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "red_card_fine" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "red_card_fine" SET DEFAULT 5000;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "late_fine" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "late_fine" SET DEFAULT 10000;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "court_fee" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ALTER COLUMN "referee_fee" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "match_id" uuid;--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "half" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "referee_fee_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;