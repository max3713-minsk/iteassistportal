-- Schemes per organization (support workflow contacts)
CREATE TABLE public.support_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Схема технической поддержки',
  subtitle text,
  hotline_city text,
  hotline_mobile text,
  ivr_business_hours text DEFAULT '08:00 — 17:00',
  ivr_after_hours text DEFAULT '17:00 — 08:00, выходные и праздники',
  sla_note text,
  customer_responsible_name text,
  customer_responsible_phone text,
  customer_responsible_role text DEFAULT 'Ответственное лицо от Заказчика',
  contractor_responsible_name text,
  contractor_responsible_phone text,
  contractor_responsible_role text DEFAULT 'Ответственное лицо от Исполнителя',
  escalation_name text,
  escalation_phone text,
  escalation_role text DEFAULT 'Старший дежурный (эскалация)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE TABLE public.support_scheme_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id uuid NOT NULL REFERENCES public.support_schemes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  line_number text,
  line_name text NOT NULL,
  description text,
  primary_engineer_name text,
  primary_engineer_phone text,
  fallback_engineer_name text,
  fallback_engineer_phone text,
  color text DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_scheme_lines_scheme ON public.support_scheme_lines(scheme_id, position);

ALTER TABLE public.support_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_scheme_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view schemes" ON public.support_schemes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage schemes" ON public.support_schemes FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Authenticated view scheme lines" ON public.support_scheme_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage scheme lines" ON public.support_scheme_lines FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER update_support_schemes_updated_at BEFORE UPDATE ON public.support_schemes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_scheme_lines_updated_at BEFORE UPDATE ON public.support_scheme_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();