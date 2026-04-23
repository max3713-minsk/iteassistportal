-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule with the same name
DO $$
BEGIN
  PERFORM cron.unschedule('ticket-sla-reminders-5min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule every 5 minutes
SELECT cron.schedule(
  'ticket-sla-reminders-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://stersnytcxapngyrhugg.supabase.co/functions/v1/ticket-sla-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXJzbnl0Y3hhcG5neXJodWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjgyMzIsImV4cCI6MjA5MTYwNDIzMn0.VOHByu5T6s40mZDQX2fXXjRav1Y3MM04YqtlDPL3KCo'
    ),
    body := '{}'::jsonb
  );
  $$
);
