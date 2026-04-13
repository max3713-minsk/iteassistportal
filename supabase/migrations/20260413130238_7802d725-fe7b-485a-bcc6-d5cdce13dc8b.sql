
ALTER TABLE public.maintenance_protocols
ADD COLUMN ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL;

CREATE INDEX idx_protocols_ticket_id ON public.maintenance_protocols(ticket_id);
