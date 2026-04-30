-- Holidays and workday transfers for Republic of Belarus
CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  day_type text NOT NULL DEFAULT 'holiday', -- 'holiday' (нерабочий) | 'workday' (рабочая суббота, перенос) | 'short_day'
  source text NOT NULL DEFAULT 'manual',    -- 'manual' | 'nager' | 'api'
  country_code text NOT NULL DEFAULT 'BY',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_holidays_date ON public.holidays(date);
CREATE INDEX idx_holidays_country_year ON public.holidays(country_code, date);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view holidays"
ON public.holidays FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage holidays"
ON public.holidays FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Engineers manage holidays"
ON public.holidays FOR ALL
USING (has_role(auth.uid(), 'engineer'::app_role))
WITH CHECK (has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();