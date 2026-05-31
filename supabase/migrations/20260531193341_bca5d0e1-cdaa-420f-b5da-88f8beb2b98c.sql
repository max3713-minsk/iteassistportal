-- Flags/labels and engineer comments on Zabbix problems/triggers
CREATE TYPE public.problem_flag_level AS ENUM ('important', 'attention', 'minor');

CREATE TABLE public.problem_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Either eventid (для конкретной проблемы) или triggerid (для триггера в целом)
  eventid TEXT,
  triggerid TEXT,
  host TEXT,
  flag public.problem_flag_level NOT NULL DEFAULT 'attention',
  comment TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT problem_flags_target_chk CHECK (eventid IS NOT NULL OR triggerid IS NOT NULL)
);

CREATE UNIQUE INDEX problem_flags_event_uidx ON public.problem_flags(eventid) WHERE eventid IS NOT NULL;
CREATE UNIQUE INDEX problem_flags_trigger_uidx ON public.problem_flags(triggerid) WHERE triggerid IS NOT NULL AND eventid IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_flags TO authenticated;
GRANT ALL ON public.problem_flags TO service_role;

ALTER TABLE public.problem_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view flags"
  ON public.problem_flags FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Staff can insert flags"
  ON public.problem_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND (
      public.has_role(auth.uid(), 'admin'::app_role) OR
      public.has_role(auth.uid(), 'engineer'::app_role)
    )
  );

CREATE POLICY "Staff can update flags"
  ON public.problem_flags FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'engineer'::app_role)
  );

CREATE POLICY "Staff can delete flags"
  ON public.problem_flags FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'engineer'::app_role)
  );

CREATE TRIGGER update_problem_flags_updated_at
  BEFORE UPDATE ON public.problem_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();