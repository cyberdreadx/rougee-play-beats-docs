-- Create enum for verification request status
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  message TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests
FOR SELECT
USING (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

-- Users can create their own requests (only if they don't have a pending one)
CREATE POLICY "Users can create verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (
  wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)
  AND NOT EXISTS (
    SELECT 1 FROM public.verification_requests
    WHERE wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)
    AND status = 'pending'
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests
FOR SELECT
USING (public.is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Admins can update requests (for approval/rejection)
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests
FOR UPDATE
USING (public.is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)))
WITH CHECK (public.is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Add trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();