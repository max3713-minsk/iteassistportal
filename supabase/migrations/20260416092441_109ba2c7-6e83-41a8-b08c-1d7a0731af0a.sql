
-- Add new statuses to ticket_status enum
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add new columns to tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS product_code text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS request_type text DEFAULT 'incident',
  ADD COLUMN IF NOT EXISTS incident_category text;

-- Create ticket_status_history table
CREATE TABLE IF NOT EXISTS public.ticket_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  changed_by_name text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all status history"
  ON public.ticket_status_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Engineers can view all status history"
  ON public.ticket_status_history FOR SELECT
  USING (public.has_role(auth.uid(), 'engineer'));

CREATE POLICY "Users can view own ticket history"
  ON public.ticket_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_status_history.ticket_id
      AND tickets.created_by = auth.uid()
  ));

CREATE POLICY "Authenticated can insert status history"
  ON public.ticket_status_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by);

CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id ON public.ticket_status_history(ticket_id);
