-- Drop the old user_roles table and recreate it for wallet-based auth
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Create user_roles table with wallet addresses
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can view roles
CREATE POLICY "Anyone can view user roles"
ON public.user_roles
FOR SELECT
USING (true);

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)
    AND role = 'admin'
  )
);

-- Create security definer function to check roles by wallet
CREATE OR REPLACE FUNCTION public.has_role_by_wallet(_wallet_address TEXT, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE wallet_address = _wallet_address
    AND role = _role
  )
$$;

-- Migrate existing roles from profiles table
INSERT INTO public.user_roles (wallet_address, role)
SELECT wallet_address, role::public.app_role
FROM public.profiles
WHERE wallet_address IS NOT NULL AND role IS NOT NULL
ON CONFLICT (wallet_address, role) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_user_roles_wallet ON public.user_roles(wallet_address);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);