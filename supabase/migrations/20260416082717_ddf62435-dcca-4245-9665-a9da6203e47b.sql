
-- Add is_active to profiles for blocking users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add target_user_id to audit_logs for tracking user management actions
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_user_id uuid;

-- Allow admins to update any profile (for blocking)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
