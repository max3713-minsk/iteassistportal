-- Integration settings (admin-managed key-value config for external systems)
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integration settings"
ON public.integration_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers view integration settings"
ON public.integration_settings FOR SELECT
USING (public.has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER trg_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GitLab ticket links
CREATE TABLE public.gitlab_ticket_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  project_id TEXT NOT NULL,
  issue_iid INTEGER NOT NULL,
  issue_url TEXT NOT NULL,
  issue_state TEXT NOT NULL DEFAULT 'opened',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gitlab_links_ticket ON public.gitlab_ticket_links(ticket_id);

ALTER TABLE public.gitlab_ticket_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view gitlab links"
ON public.gitlab_ticket_links FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Admins manage gitlab links"
ON public.gitlab_ticket_links FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage gitlab links"
ON public.gitlab_ticket_links FOR ALL
USING (public.has_role(auth.uid(), 'engineer'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER trg_gitlab_links_updated_at
BEFORE UPDATE ON public.gitlab_ticket_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Templates library (local Zabbix template definitions saved in portal)
CREATE TABLE public.zabbix_template_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'local', -- local | official | community
  source_url TEXT,
  category TEXT,
  description TEXT,
  yaml_content TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  imported_from TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.zabbix_template_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view templates"
ON public.zabbix_template_library FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Admins manage templates"
ON public.zabbix_template_library FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage templates"
ON public.zabbix_template_library FOR ALL
USING (public.has_role(auth.uid(), 'engineer'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER trg_zabbix_tpl_updated_at
BEFORE UPDATE ON public.zabbix_template_library
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();