ALTER TABLE public.notification_channels DROP CONSTRAINT IF EXISTS notification_channels_channel_type_check;
ALTER TABLE public.notification_channels ADD CONSTRAINT notification_channels_channel_type_check
  CHECK (channel_type = ANY (ARRAY['telegram'::text,'mattermost'::text,'email'::text,'smtp'::text,'sms'::text,'mts_sms'::text,'a1_sms'::text,'web_push'::text,'webhook'::text]));

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS notification_log_channel_type_check;