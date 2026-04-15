
-- Device type enum
CREATE TYPE public.device_type AS ENUM ('server', 'bmc', 'switch', 'storage', 'firewall', 'ups', 'router', 'other');

-- Monitoring protocol enum
CREATE TYPE public.monitoring_protocol AS ENUM ('SNMP', 'IPMI', 'SSH', 'HTTP', 'HTTPS', 'Agent');

CREATE TABLE public.monitored_hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  device_type public.device_type NOT NULL DEFAULT 'server',
  protocol public.monitoring_protocol NOT NULL DEFAULT 'Agent',
  port INTEGER,
  snmp_community TEXT,
  credentials_login TEXT,
  credentials_password TEXT,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  zabbix_host_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.monitored_hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage monitored hosts"
  ON public.monitored_hosts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers can manage monitored hosts"
  ON public.monitored_hosts FOR ALL
  USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Authenticated can view monitored hosts"
  ON public.monitored_hosts FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_monitored_hosts_updated_at
  BEFORE UPDATE ON public.monitored_hosts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
