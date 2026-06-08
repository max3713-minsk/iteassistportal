ALTER TABLE public.maintenance_tasks
  ADD COLUMN IF NOT EXISTS include_in_protocol boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_mtasks_include_in_protocol
  ON public.maintenance_tasks (include_in_protocol);