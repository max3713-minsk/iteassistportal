
-- Organizations: header fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS legal_full_name text,
  ADD COLUMN IF NOT EXISTS executor_default text;

-- Contracts: per-contract executor
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS executor_org_name text;

-- Maintenance protocols: header + signatures
ALTER TABLE public.maintenance_protocols
  ADD COLUMN IF NOT EXISTS report_date date,
  ADD COLUMN IF NOT EXISTS customer_org_id uuid,
  ADD COLUMN IF NOT EXISTS executor_org_id uuid,
  ADD COLUMN IF NOT EXISTS header_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS executor_signature_user_id uuid,
  ADD COLUMN IF NOT EXISTS responsible_signature_user_id uuid;

-- Protocol items: equipment snapshot for stability
ALTER TABLE public.protocol_items
  ADD COLUMN IF NOT EXISTS equipment_snapshot jsonb;

-- Profiles: signature path
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signature_path text;

-- Storage bucket for signatures (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: user owns folder named by user_id
DROP POLICY IF EXISTS "Users view own signature" ON storage.objects;
CREATE POLICY "Users view own signature"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users upload own signature" ON storage.objects;
CREATE POLICY "Users upload own signature"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own signature" ON storage.objects;
CREATE POLICY "Users update own signature"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own signature" ON storage.objects;
CREATE POLICY "Users delete own signature"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins view all signatures" ON storage.objects;
CREATE POLICY "Admins view all signatures"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Staff view signatures for protocols" ON storage.objects;
CREATE POLICY "Staff view signatures for protocols"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'engineer'));
