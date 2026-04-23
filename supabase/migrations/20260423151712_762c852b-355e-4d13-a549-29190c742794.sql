-- ============================================
-- Multi-organization + Multi-Zabbix foundation
-- ============================================

-- 1. Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  inn TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view orgs" ON public.organizations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage orgs" ON public.organizations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Contracts (договоры с датой старта работ и сканом)
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  title TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  scan_path TEXT, -- путь в storage bucket "documents"
  scan_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view contracts" ON public.contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage contracts" ON public.contracts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contracts_org ON public.contracts(organization_id);
CREATE INDEX idx_contracts_active ON public.contracts(is_active, start_date);

-- 3. Zabbix connections (мульти-Zabbix, 1 подключение = 1 организация)
CREATE TABLE public.zabbix_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zabbix_url TEXT NOT NULL,
  zabbix_user TEXT NOT NULL,
  zabbix_password TEXT NOT NULL,
  vpn_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.zabbix_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view zabbix connections" ON public.zabbix_connections
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'engineer'::app_role));
CREATE POLICY "Admins manage zabbix connections" ON public.zabbix_connections
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_zabbix_connections_updated_at
  BEFORE UPDATE ON public.zabbix_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add organization_id to existing tables (NULLABLE сначала, заполним, потом сделаем NOT NULL где нужно)
ALTER TABLE public.sites ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.equipment ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tickets ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.documents ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.documents ADD COLUMN doc_category TEXT NOT NULL DEFAULT 'technical';
-- doc_category: technical | contract | act | other
ALTER TABLE public.monitored_hosts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.monitored_hosts ADD COLUMN zabbix_connection_id UUID REFERENCES public.zabbix_connections(id);
ALTER TABLE public.maintenance_protocols ADD COLUMN contract_id UUID REFERENCES public.contracts(id);

-- 5. Migrate existing data into a default organization
INSERT INTO public.organizations (name, short_name)
VALUES ('РУП "Брестэнерго"', 'Брестэнерго');

UPDATE public.sites SET organization_id = (SELECT id FROM public.organizations WHERE name = 'РУП "Брестэнерго"');
UPDATE public.equipment SET organization_id = (SELECT id FROM public.organizations WHERE name = 'РУП "Брестэнерго"');
UPDATE public.tickets SET organization_id = (SELECT id FROM public.organizations WHERE name = 'РУП "Брестэнерго"');
UPDATE public.documents SET organization_id = (SELECT id FROM public.organizations WHERE name = 'РУП "Брестэнерго"');
UPDATE public.monitored_hosts SET organization_id = (SELECT id FROM public.organizations WHERE name = 'РУП "Брестэнерго"');

-- Migrate existing zabbix_settings -> zabbix_connections
INSERT INTO public.zabbix_connections (organization_id, name, zabbix_url, zabbix_user, zabbix_password, vpn_info, is_active, is_default)
SELECT 
  (SELECT id FROM public.organizations WHERE name = 'РУП "Брестэнерго"'),
  'Основное подключение Zabbix',
  zabbix_url, zabbix_user, zabbix_password, vpn_info, is_active, true
FROM public.zabbix_settings
WHERE is_active = true
LIMIT 1;

UPDATE public.monitored_hosts 
SET zabbix_connection_id = (SELECT id FROM public.zabbix_connections WHERE is_default = true LIMIT 1)
WHERE zabbix_host_id IS NOT NULL;

-- 6. Comment notification_channels: add channel_type 'smtp' (no schema change, just config interpretation)
-- config for smtp: { host, port, secure, username, password, from_email, from_name, to_email }

CREATE INDEX idx_sites_org ON public.sites(organization_id);
CREATE INDEX idx_equipment_org ON public.equipment(organization_id);
CREATE INDEX idx_tickets_org ON public.tickets(organization_id);
CREATE INDEX idx_documents_org ON public.documents(organization_id);
CREATE INDEX idx_documents_category ON public.documents(doc_category);
CREATE INDEX idx_hosts_org ON public.monitored_hosts(organization_id);
CREATE INDEX idx_hosts_zbx_conn ON public.monitored_hosts(zabbix_connection_id);