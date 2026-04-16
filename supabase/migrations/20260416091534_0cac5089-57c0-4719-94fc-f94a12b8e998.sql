
CREATE TABLE public.zabbix_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zabbix_url text NOT NULL DEFAULT '',
  zabbix_user text NOT NULL DEFAULT '',
  zabbix_password text NOT NULL DEFAULT '',
  vpn_info text DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.zabbix_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view zabbix settings"
  ON public.zabbix_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert zabbix settings"
  ON public.zabbix_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update zabbix settings"
  ON public.zabbix_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure only one row
CREATE UNIQUE INDEX zabbix_settings_singleton ON public.zabbix_settings ((true));
