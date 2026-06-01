ALTER TABLE public.maintenance_tasks
  ADD COLUMN IF NOT EXISTS equipment_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_equipment_ids
  ON public.maintenance_tasks USING GIN (equipment_ids);