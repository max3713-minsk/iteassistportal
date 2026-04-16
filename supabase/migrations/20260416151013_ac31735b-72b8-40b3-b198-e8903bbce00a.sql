
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  script_id text,
  script_name text NOT NULL,
  host_id text,
  host_name text,
  result text,
  status text NOT NULL DEFAULT 'running',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation logs"
  ON public.automation_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers can manage automation logs"
  ON public.automation_logs FOR ALL
  USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Authenticated can view automation logs"
  ON public.automation_logs FOR SELECT TO authenticated
  USING (true);

CREATE INDEX idx_automation_logs_created ON public.automation_logs(created_at DESC);
