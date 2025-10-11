-- Fix admin RLS policies to work with user_roles table
-- Drop existing admin policies for verification_requests
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;

-- Create new policies using the is_admin function with wallet address from custom header
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests
FOR SELECT
USING (
  is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text))
);

CREATE POLICY "Admins can update verification requests"
ON public.verification_requests
FOR UPDATE
USING (
  is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text))
)
WITH CHECK (
  is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text))
);