
-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  organization TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  uploaded_by UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Engineers can manage documents" ON public.documents FOR ALL USING (has_role(auth.uid(), 'engineer'::app_role));

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Authenticated can view document files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Admins can upload document files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Engineers can upload document files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'engineer'::app_role));
CREATE POLICY "Admins can delete document files" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Engineers can delete document files" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND has_role(auth.uid(), 'engineer'::app_role));
