DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebhookStatus') THEN
    CREATE TYPE "WebhookStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "reference" TEXT,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PROCESSING',
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");
CREATE INDEX IF NOT EXISTS "webhook_events_provider_event_type_idx" ON "webhook_events"("provider", "event_type");
CREATE INDEX IF NOT EXISTS "webhook_events_provider_status_idx" ON "webhook_events"("provider", "status");
CREATE INDEX IF NOT EXISTS "webhook_events_reference_idx" ON "webhook_events"("reference");
