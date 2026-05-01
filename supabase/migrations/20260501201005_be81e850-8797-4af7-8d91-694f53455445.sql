-- Add is_read flag to notification_log for unread badge
ALTER TABLE public.notification_log 
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notif_log_unread 
  ON public.notification_log(user_id, is_read) 
  WHERE is_read = false;

-- Allow user to update is_read on own notifications
DROP POLICY IF EXISTS "Users mark own notifications read" ON public.notification_log;
CREATE POLICY "Users mark own notifications read" ON public.notification_log
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);