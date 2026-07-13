-- Настройки лог-хранилища на карточке оборудования
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS log_storage_id uuid REFERENCES public.backup_storage_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS log_path text,
  ADD COLUMN IF NOT EXISTS log_filename_pattern text,
  ADD COLUMN IF NOT EXISTS log_extensions text[] DEFAULT ARRAY['.txt','.log']::text[],
  ADD COLUMN IF NOT EXISTS log_max_age_days integer DEFAULT 30;

-- Реестр обнаруженных лог-файлов на SFTP
CREATE TABLE IF NOT EXISTS public.equipment_log_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  storage_id uuid NOT NULL REFERENCES public.backup_storage_connections(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  size_bytes bigint,
  file_mtime timestamptz,
  status text NOT NULL DEFAULT 'new', -- new | analyzed | ignored | missing
  analyzed_log_id uuid REFERENCES public.equipment_logs(id) ON DELETE SET NULL,
  last_error text,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipment_id, file_path)
);

CREATE INDEX IF NOT EXISTS equipment_log_files_equipment_idx ON public.equipment_log_files(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_log_files_status_idx    ON public.equipment_log_files(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_log_files TO authenticated;
GRANT ALL ON public.equipment_log_files TO service_role;

ALTER TABLE public.equipment_log_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log files: read for authenticated"
  ON public.equipment_log_files FOR SELECT TO authenticated USING (true);

CREATE POLICY "log files: staff can manage"
  ON public.equipment_log_files FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'engineer'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'engineer'::app_role)
  );

CREATE TRIGGER trg_equipment_log_files_updated_at
  BEFORE UPDATE ON public.equipment_log_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();