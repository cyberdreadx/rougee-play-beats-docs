-- Fix infinite recursion in user_roles RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(check_wallet text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE wallet_address = check_wallet
    AND role = 'admin'::app_role
  );
$$;

-- Recreate the policy using the function
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  public.is_admin(
    (current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text
  )
);