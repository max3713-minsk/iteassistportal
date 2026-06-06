CREATE TABLE public.protocol_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.maintenance_protocols(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  storage text NOT NULL DEFAULT 'seafile',
  url text,
  filename text,
  folder text,
  meta jsonb
);

CREATE INDEX idx_protocol_uploads_protocol ON public.protocol_uploads(protocol_id);
CREATE INDEX idx_protocol_uploads_uploaded_at ON public.protocol_uploads(uploaded_at DESC);

GRANT SELECT, INSERT, DELETE ON public.protocol_uploads TO authenticated;
GRANT ALL ON public.protocol_uploads TO service_role;

ALTER TABLE public.protocol_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view uploads"
  ON public.protocol_uploads FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert uploads"
  ON public.protocol_uploads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admin can delete uploads"
  ON public.protocol_uploads FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));