-- ════════════════════════════════════════════════════════════
-- 1. monitoring_host_links: связь Zabbix хост ↔ Equipment (CMDB)
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.monitoring_host_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zabbix_host_id TEXT NOT NULL,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  auto_matched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(zabbix_host_id),
  UNIQUE(equipment_id)
);

CREATE INDEX idx_monitoring_host_links_zabbix ON public.monitoring_host_links(zabbix_host_id);
CREATE INDEX idx_monitoring_host_links_equipment ON public.monitoring_host_links(equipment_id);

ALTER TABLE public.monitoring_host_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view host links"
  ON public.monitoring_host_links FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage host links"
  ON public.monitoring_host_links FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage host links"
  ON public.monitoring_host_links FOR ALL
  USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER update_monitoring_host_links_updated_at
  BEFORE UPDATE ON public.monitoring_host_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════
-- 2. alert_thresholds: пользовательские пороги предупреждений
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key TEXT NOT NULL,
  host_id UUID REFERENCES public.monitored_hosts(id) ON DELETE CASCADE,
  zabbix_host_id TEXT,
  display_name TEXT,
  warning_value NUMERIC,
  critical_value NUMERIC,
  comparison TEXT NOT NULL DEFAULT '>' CHECK (comparison IN ('>', '<', '>=', '<=', '=', '!=')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_create_ticket BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_alert_thresholds_item_key ON public.alert_thresholds(item_key);
CREATE INDEX idx_alert_thresholds_host ON public.alert_thresholds(host_id);

ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view thresholds"
  ON public.alert_thresholds FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage thresholds"
  ON public.alert_thresholds FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage thresholds"
  ON public.alert_thresholds FOR ALL
  USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER update_alert_thresholds_updated_at
  BEFORE UPDATE ON public.alert_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════
-- 3. saved_graphs: библиотека пользовательских графиков
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.saved_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  host_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  chart_type TEXT NOT NULL DEFAULT 'line' CHECK (chart_type IN ('line', 'bar', 'area')),
  time_range TEXT NOT NULL DEFAULT '1h',
  aggregation TEXT DEFAULT 'avg' CHECK (aggregation IN ('avg', 'min', 'max', 'sum', 'last')),
  is_template BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  tz_requirement_codes JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_graphs_user ON public.saved_graphs(user_id);
CREATE INDEX idx_saved_graphs_template ON public.saved_graphs(is_template) WHERE is_template = true;
CREATE INDEX idx_saved_graphs_shared ON public.saved_graphs(is_shared) WHERE is_shared = true;

ALTER TABLE public.saved_graphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own and shared graphs"
  ON public.saved_graphs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true OR is_template = true);

CREATE POLICY "Users manage own graphs"
  ON public.saved_graphs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all graphs"
  ON public.saved_graphs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage shared and templates"
  ON public.saved_graphs FOR ALL
  USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER update_saved_graphs_updated_at
  BEFORE UPDATE ON public.saved_graphs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();