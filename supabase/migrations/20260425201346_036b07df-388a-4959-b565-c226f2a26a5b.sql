CREATE TABLE IF NOT EXISTS public.system_kill_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by uuid,
  triggered_email text,
  status text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_kill_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view kill log" ON public.system_kill_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));