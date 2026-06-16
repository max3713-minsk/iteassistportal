-- 1. Подключения к файловым хранилищам (SFTP поверх tftp-root)
CREATE TABLE IF NOT EXISTS public.backup_storage_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 22,
  username text NOT NULL,
  auth_method text NOT NULL DEFAULT 'password' CHECK (auth_method IN ('password','key')),
  password text,
  private_key text,
  base_path text NOT NULL DEFAULT '/',
  enabled boolean NOT NULL DEFAULT true,
  notes text,
  last_checked_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_storage_connections TO authenticated;
GRANT ALL ON public.backup_storage_connections TO service_role;
ALTER TABLE public.backup_storage_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_storage_admin_all" ON public.backup_storage_connections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER backup_storage_connections_updated_at
  BEFORE UPDATE ON public.backup_storage_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Журнал проверок
CREATE TABLE IF NOT EXISTS public.equipment_backup_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  storage_id uuid REFERENCES public.backup_storage_connections(id) ON DELETE SET NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('ok','stale','missing','checksum_mismatch','error')),
  file_path text,
  file_size bigint,
  file_mtime timestamptz,
  md5_actual text,
  md5_expected text,
  message text,
  triggered_by text NOT NULL DEFAULT 'manual'
);

CREATE INDEX idx_backup_checks_equipment ON public.equipment_backup_checks(equipment_id, checked_at DESC);
CREATE INDEX idx_backup_checks_storage ON public.equipment_backup_checks(storage_id);

GRANT SELECT ON public.equipment_backup_checks TO authenticated;
GRANT ALL ON public.equipment_backup_checks TO service_role;
ALTER TABLE public.equipment_backup_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_checks_view_auth" ON public.equipment_backup_checks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "backup_checks_staff_manual" ON public.equipment_backup_checks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'engineer'::app_role)
  );

-- 3. Привязка бэкапа на карточке оборудования
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS backup_storage_id uuid REFERENCES public.backup_storage_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS backup_path text,
  ADD COLUMN IF NOT EXISTS backup_extensions text[],
  ADD COLUMN IF NOT EXISTS backup_max_age_hours integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS backup_min_size_kb integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS backup_md5_source text DEFAULT 'sidecar' CHECK (backup_md5_source IN ('sidecar','stored','none')),
  ADD COLUMN IF NOT EXISTS backup_md5_expected text;