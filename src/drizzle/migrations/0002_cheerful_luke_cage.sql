ALTER TABLE "sketchs" ADD COLUMN "session_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sketchs" ADD CONSTRAINT "sketchs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
