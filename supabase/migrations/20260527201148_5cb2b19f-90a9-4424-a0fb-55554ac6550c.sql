
-- Item overrides: per-host control of which Zabbix items show on portal + custom names/OIDs
CREATE TABLE public.item_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zabbix_host_id text NOT NULL,
  item_key text NOT NULL,
  disabled boolean NOT NULL DEFAULT false,
  custom_display_name text,
  custom_oid text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zabbix_host_id, item_key)
);

GRANT SELECT ON public.item_overrides TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.item_overrides TO authenticated;
GRANT ALL ON public.item_overrides TO service_role;

ALTER TABLE public.item_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view item_overrides"
  ON public.item_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage item_overrides"
  ON public.item_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage item_overrides"
  ON public.item_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'engineer'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER item_overrides_updated_at
  BEFORE UPDATE ON public.item_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MIB / OID cache
CREATE TABLE public.mib_oid_cache (
  oid text PRIMARY KEY,
  name text,
  description text,
  source text NOT NULL DEFAULT 'unknown',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mib_oid_cache TO authenticated;
GRANT INSERT, UPDATE ON public.mib_oid_cache TO authenticated;
GRANT ALL ON public.mib_oid_cache TO service_role;

ALTER TABLE public.mib_oid_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view oid cache"
  ON public.mib_oid_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated write oid cache"
  ON public.mib_oid_cache FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update oid cache"
  ON public.mib_oid_cache FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER mib_oid_cache_updated_at
  BEFORE UPDATE ON public.mib_oid_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Automation logs: cancel support
ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS cancel_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;

-- Dismissed alerts: user-level "hide from list"
CREATE TABLE public.dismissed_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  eventid text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  UNIQUE (user_id, eventid)
);

GRANT SELECT, INSERT, DELETE ON public.dismissed_alerts TO authenticated;
GRANT ALL ON public.dismissed_alerts TO service_role;

ALTER TABLE public.dismissed_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dismissed alerts"
  ON public.dismissed_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
