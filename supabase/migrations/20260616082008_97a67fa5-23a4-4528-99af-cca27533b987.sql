DROP POLICY IF EXISTS "chat_threads_select" ON public.chat_threads;
CREATE POLICY "chat_threads_select" ON public.chat_threads
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_chat_participant(id, auth.uid()));