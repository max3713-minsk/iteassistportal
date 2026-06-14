ALTER TABLE public.maintenance_tasks
  ADD COLUMN IF NOT EXISTS manual_coverage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_coverage_note text;