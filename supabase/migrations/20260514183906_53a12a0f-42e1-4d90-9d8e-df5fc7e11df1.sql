CREATE TABLE public.infrastructure_map_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL,
  version_number integer NOT NULL,
  data jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  comment text,
  created_by uuid,
  created_by_name text,
  node_count integer NOT NULL DEFAULT 0,
  edge_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_imv_map_id ON public.infrastructure_map_versions(map_id, created_at DESC);

ALTER TABLE public.infrastructure_map_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view map versions"
  ON public.infrastructure_map_versions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Staff create map versions"
  ON public.infrastructure_map_versions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Staff delete map versions"
  ON public.infrastructure_map_versions FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'engineer'::app_role));