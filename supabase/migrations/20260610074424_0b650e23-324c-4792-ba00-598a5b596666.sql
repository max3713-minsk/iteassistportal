ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.ticket_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS ticket_comments_parent_id_idx
  ON public.ticket_comments(parent_id);

CREATE INDEX IF NOT EXISTS ticket_comments_ticket_created_idx
  ON public.ticket_comments(ticket_id, created_at);