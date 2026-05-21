CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'TRANSFER');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "fine_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "receipt_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "match_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "method" "payment_method" DEFAULT 'TRANSFER' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;