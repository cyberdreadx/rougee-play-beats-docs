-- Add email field to profiles table for promotional communications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.profiles.email IS 'Optional email for promotional updates and notifications (not for authentication)';
COMMENT ON COLUMN public.profiles.email_notifications IS 'Whether user wants to receive email notifications';