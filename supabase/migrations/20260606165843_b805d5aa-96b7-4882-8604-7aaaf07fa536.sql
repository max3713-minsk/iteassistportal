
CREATE TABLE public.equipment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE,
  protocol_item_id uuid REFERENCES public.protocol_items(id) ON DELETE SET NULL,
  protocol_id uuid REFERENCES public.maintenance_protocols(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  filename text,
  raw_text text,
  size_bytes int,
  analysis jsonb,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_logs TO authenticated;
GRANT ALL ON public.equipment_logs TO service_role;

ALTER TABLE public.equipment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read equipment_logs"
  ON public.equipment_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert equipment_logs"
  ON public.equipment_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins/engineers can update equipment_logs"
  ON public.equipment_logs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Admins can delete equipment_logs"
  ON public.equipment_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_equipment_logs_updated_at
  BEFORE UPDATE ON public.equipment_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX equipment_logs_equipment_idx ON public.equipment_logs(equipment_id);
CREATE INDEX equipment_logs_protocol_item_idx ON public.equipment_logs(protocol_item_id);
