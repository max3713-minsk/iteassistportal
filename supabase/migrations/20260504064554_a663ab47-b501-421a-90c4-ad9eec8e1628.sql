
CREATE TABLE public.infrastructure_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  organization_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.infrastructure_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage infra maps"
ON public.infrastructure_maps FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage infra maps"
ON public.infrastructure_maps FOR ALL
USING (public.has_role(auth.uid(), 'engineer'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Authenticated view infra maps"
ON public.infrastructure_maps FOR SELECT
TO authenticated
USING (true);

CREATE TRIGGER update_infrastructure_maps_updated_at
BEFORE UPDATE ON public.infrastructure_maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
