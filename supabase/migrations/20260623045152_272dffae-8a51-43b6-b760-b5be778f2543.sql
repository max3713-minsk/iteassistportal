
CREATE TABLE public.agent_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL UNIQUE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  hostname text,
  os_type text,
  os_version text,
  arch text,
  serial_number text,
  ip_addresses jsonb DEFAULT '[]'::jsonb,
  mac_addresses jsonb DEFAULT '[]'::jsonb,
  cpu_model text,
  cpu_cores int,
  ram_total_mb bigint,
  agent_version text,
  last_seen_at timestamptz,
  registered_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  token text NOT NULL UNIQUE,
  auto_registered boolean NOT NULL DEFAULT false,
  proxy_required boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_registrations TO authenticated;
GRANT ALL ON public.agent_registrations TO service_role;

ALTER TABLE public.agent_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view agents"
  ON public.agent_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert agents"
  ON public.agent_registrations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update agents"
  ON public.agent_registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete agents"
  ON public.agent_registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_agent_registrations_updated_at
  BEFORE UPDATE ON public.agent_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_agent_registrations_last_seen ON public.agent_registrations(last_seen_at DESC);
CREATE INDEX idx_agent_registrations_equipment ON public.agent_registrations(equipment_id);
CREATE INDEX idx_agent_registrations_organization ON public.agent_registrations(organization_id);


CREATE TABLE public.agent_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL REFERENCES public.agent_registrations(agent_id) ON DELETE CASCADE,
  collected_at timestamptz NOT NULL DEFAULT now(),
  cpu_usage_percent numeric,
  ram_used_mb bigint,
  ram_total_mb bigint,
  disk_metrics jsonb,
  network_metrics jsonb,
  temperatures jsonb,
  services jsonb,
  uptime_seconds bigint,
  load_avg jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_metrics TO authenticated;
GRANT ALL ON public.agent_metrics TO service_role;

ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view metrics"
  ON public.agent_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage metrics"
  ON public.agent_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_agent_metrics_agent_collected ON public.agent_metrics(agent_id, collected_at DESC);


CREATE TABLE public.agent_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL REFERENCES public.agent_registrations(agent_id) ON DELETE CASCADE,
  command_type text NOT NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_commands TO authenticated;
GRANT ALL ON public.agent_commands TO service_role;

ALTER TABLE public.agent_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view commands"
  ON public.agent_commands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert commands"
  ON public.agent_commands FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update commands"
  ON public.agent_commands FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete commands"
  ON public.agent_commands FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_agent_commands_agent_status ON public.agent_commands(agent_id, status);
