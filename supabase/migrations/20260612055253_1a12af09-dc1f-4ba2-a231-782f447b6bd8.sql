ALTER TABLE public.ticket_comments REPLICA IDENTITY FULL;
DO $$ BEGIN BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments'; EXCEPTION WHEN duplicate_object THEN NULL; END; END $$;

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'direct' CHECK (kind IN ('direct','group')),
  title text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_thread_participants (
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  muted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (thread_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_thread_participants TO authenticated;
GRANT ALL ON public.chat_thread_participants TO service_role;
ALTER TABLE public.chat_thread_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_thread_created_idx ON public.chat_messages (thread_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_participant(_thread uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.chat_thread_participants WHERE thread_id = _thread AND user_id = _user);
$fn$;

CREATE POLICY "chat_threads_select" ON public.chat_threads FOR SELECT TO authenticated USING (public.is_chat_participant(id, auth.uid()));
CREATE POLICY "chat_threads_insert" ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "chat_threads_update" ON public.chat_threads FOR UPDATE TO authenticated USING (public.is_chat_participant(id, auth.uid())) WITH CHECK (public.is_chat_participant(id, auth.uid()));
CREATE POLICY "chat_threads_delete" ON public.chat_threads FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "chat_participants_select" ON public.chat_thread_participants FOR SELECT TO authenticated USING (public.is_chat_participant(thread_id, auth.uid()));
CREATE POLICY "chat_participants_insert" ON public.chat_thread_participants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.created_by = auth.uid()) OR public.is_chat_participant(thread_id, auth.uid()));
CREATE POLICY "chat_participants_update" ON public.chat_thread_participants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_participants_delete" ON public.chat_thread_participants FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.created_by = auth.uid()));

CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT TO authenticated USING (public.is_chat_participant(thread_id, auth.uid()));
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_chat_participant(thread_id, auth.uid()));
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_messages_delete" ON public.chat_messages FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.bump_chat_thread_activity() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN UPDATE public.chat_threads SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.thread_id; RETURN NEW; END;
$fn$;
DROP TRIGGER IF EXISTS chat_messages_bump ON public.chat_messages;
CREATE TRIGGER chat_messages_bump AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.bump_chat_thread_activity();

ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
ALTER TABLE public.chat_thread_participants REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
DO $$ BEGIN BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads'; EXCEPTION WHEN duplicate_object THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_thread_participants'; EXCEPTION WHEN duplicate_object THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages'; EXCEPTION WHEN duplicate_object THEN NULL; END; END $$;