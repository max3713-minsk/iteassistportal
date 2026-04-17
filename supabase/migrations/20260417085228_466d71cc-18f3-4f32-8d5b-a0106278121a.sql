-- Extend monitored_hosts
ALTER TABLE public.monitored_hosts
  ADD COLUMN IF NOT EXISTS visible_name text,
  ADD COLUMN IF NOT EXISTS host_group text,
  ADD COLUMN IF NOT EXISTS protocols_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS templates jsonb DEFAULT '[]'::jsonb;

-- item_aliases
CREATE TABLE IF NOT EXISTS public.item_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.monitored_hosts(id) ON DELETE CASCADE,
  zabbix_host_id text,
  item_key text NOT NULL,
  display_name text NOT NULL,
  description text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (host_id, item_key)
);
ALTER TABLE public.item_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view item aliases" ON public.item_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage item aliases" ON public.item_aliases FOR ALL USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Engineers can manage item aliases" ON public.item_aliases FOR ALL USING (has_role(auth.uid(),'engineer'::app_role));
CREATE TRIGGER trg_item_aliases_updated BEFORE UPDATE ON public.item_aliases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_dashboard_widgets
CREATE TABLE IF NOT EXISTS public.user_dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  widget_type text NOT NULL,           -- 'graph', 'value', 'table', 'text'
  title text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own widgets" ON public.user_dashboard_widgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all widgets" ON public.user_dashboard_widgets FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_widgets_updated BEFORE UPDATE ON public.user_dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- tz_requirements
CREATE TABLE IF NOT EXISTS public.tz_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  check_type text,                       -- 'monitoring' | 'automation' | 'manual'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tz_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view TZ requirements" ON public.tz_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage TZ requirements" ON public.tz_requirements FOR ALL USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Engineers manage TZ requirements" ON public.tz_requirements FOR ALL USING (has_role(auth.uid(),'engineer'::app_role));
CREATE TRIGGER trg_tz_req_updated BEFORE UPDATE ON public.tz_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- tz_coverage
CREATE TABLE IF NOT EXISTS public.tz_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES public.tz_requirements(id) ON DELETE CASCADE,
  host_id uuid REFERENCES public.monitored_hosts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'none',   -- 'covered' | 'partial' | 'none'
  related_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tz_coverage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view TZ coverage" ON public.tz_coverage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage TZ coverage" ON public.tz_coverage FOR ALL USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Engineers manage TZ coverage" ON public.tz_coverage FOR ALL USING (has_role(auth.uid(),'engineer'::app_role));
CREATE TRIGGER trg_tz_cov_updated BEFORE UPDATE ON public.tz_coverage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tz_coverage_req ON public.tz_coverage(requirement_id);
CREATE INDEX IF NOT EXISTS idx_tz_coverage_host ON public.tz_coverage(host_id);
CREATE INDEX IF NOT EXISTS idx_item_aliases_host ON public.item_aliases(host_id);
CREATE INDEX IF NOT EXISTS idx_widgets_user ON public.user_dashboard_widgets(user_id);