ALTER TABLE public.equipment 
  ADD COLUMN IF NOT EXISTS warranty_until date,
  ADD COLUMN IF NOT EXISTS warranty_provider text;