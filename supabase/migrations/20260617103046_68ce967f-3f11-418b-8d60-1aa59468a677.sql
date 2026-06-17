-- Add history visibility cutoff for chat participants.
-- If history_from IS NULL, participant sees the entire thread.
-- If set, participant sees only messages with created_at >= history_from.
ALTER TABLE public.chat_thread_participants
  ADD COLUMN IF NOT EXISTS history_from timestamptz;

-- Replace chat_messages SELECT policy to honour the per-participant cutoff.
DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_thread_participants p
      WHERE p.thread_id = chat_messages.thread_id
        AND p.user_id = auth.uid()
        AND (p.history_from IS NULL OR chat_messages.created_at >= p.history_from)
    )
  );