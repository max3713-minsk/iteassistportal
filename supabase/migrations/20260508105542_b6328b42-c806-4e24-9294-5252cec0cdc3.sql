
CREATE TABLE public.ticket_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE,
  analysis JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read analyses" ON public.ticket_ai_analyses
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Staff write analyses" ON public.ticket_ai_analyses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'engineer'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER update_ticket_ai_analyses_updated_at
  BEFORE UPDATE ON public.ticket_ai_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
