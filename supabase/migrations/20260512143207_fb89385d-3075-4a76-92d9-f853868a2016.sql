
-- Add mentions array to comments
ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS mentions uuid[] NOT NULL DEFAULT '{}';

-- Reactions
CREATE TABLE IF NOT EXISTS public.ticket_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.ticket_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_tcr_comment ON public.ticket_comment_reactions(comment_id);

ALTER TABLE public.ticket_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view reactions" ON public.ticket_comment_reactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add own reactions" ON public.ticket_comment_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON public.ticket_comment_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ticket links
DO $$ BEGIN
  CREATE TYPE public.ticket_link_kind AS ENUM ('related','duplicate','parent','child','blocks','blocked_by');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ticket_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ticket_id uuid NOT NULL,
  target_ticket_id uuid NOT NULL,
  kind public.ticket_link_kind NOT NULL DEFAULT 'related',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_ticket_id, target_ticket_id, kind),
  CHECK (source_ticket_id <> target_ticket_id)
);
CREATE INDEX IF NOT EXISTS idx_tl_source ON public.ticket_links(source_ticket_id);
CREATE INDEX IF NOT EXISTS idx_tl_target ON public.ticket_links(target_ticket_id);

ALTER TABLE public.ticket_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view ticket links" ON public.ticket_links
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage ticket links" ON public.ticket_links
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'engineer'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'engineer'));
