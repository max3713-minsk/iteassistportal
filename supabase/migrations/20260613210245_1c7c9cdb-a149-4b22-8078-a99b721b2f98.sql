-- Storage policies for chat-attachments: only participants can read/upload to their threads
-- Path convention: <thread_id>/<filename>

CREATE POLICY "chat attach: participants can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.is_chat_participant((split_part(name, '/', 1))::uuid, auth.uid())
);

CREATE POLICY "chat attach: participants can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.is_chat_participant((split_part(name, '/', 1))::uuid, auth.uid())
);

CREATE POLICY "chat attach: owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments' AND owner = auth.uid()
);