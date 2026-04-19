
-- Channels
CREATE TABLE public.notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('telegram','mattermost','email','sms')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT false,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  last_test_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_channels_user ON public.notification_channels(user_id);
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own channels" ON public.notification_channels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all channels" ON public.notification_channels
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscriptions: which event types user wants
CREATE TABLE public.notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  min_priority TEXT,
  channel_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type)
);
CREATE INDEX idx_notif_subs_user ON public.notification_subscriptions(user_id);
CREATE INDEX idx_notif_subs_event ON public.notification_subscriptions(event_type) WHERE enabled = true;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subs" ON public.notification_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all subs" ON public.notification_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Preferences (one per user)
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY,
  delivery_mode TEXT NOT NULL DEFAULT 'instant' CHECK (delivery_mode IN ('instant','digest','instant_critical_digest_rest')),
  dnd_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiet_bypass_critical BOOLEAN NOT NULL DEFAULT true,
  digest_schedule TEXT NOT NULL DEFAULT 'daily_09',
  timezone TEXT NOT NULL DEFAULT 'Europe/Minsk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all prefs" ON public.notification_preferences
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Log
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_id UUID,
  channel_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  priority TEXT,
  title TEXT,
  body TEXT,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  http_status INTEGER,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_log_user ON public.notification_log(user_id, created_at DESC);
CREATE INDEX idx_notif_log_status ON public.notification_log(status) WHERE status IN ('pending','failed');
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own log" ON public.notification_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all log" ON public.notification_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Queue (for digest batching and retry)
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  priority TEXT,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','done','failed','cancelled')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_queue_due ON public.notification_queue(scheduled_for) WHERE status = 'queued';
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own queue" ON public.notification_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage queue" ON public.notification_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at triggers
CREATE TRIGGER trg_notif_channels_updated BEFORE UPDATE ON public.notification_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notif_subs_updated BEFORE UPDATE ON public.notification_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notif_prefs_updated BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notif_queue_updated BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
