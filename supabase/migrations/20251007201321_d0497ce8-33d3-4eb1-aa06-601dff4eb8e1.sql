-- Create IP tracking table
CREATE TABLE public.wallet_ip_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  action TEXT NOT NULL, -- 'connect', 'mint', 'upload', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_wallet_ip_logs_wallet ON public.wallet_ip_logs(wallet_address);
CREATE INDEX idx_wallet_ip_logs_ip ON public.wallet_ip_logs(ip_address);
CREATE INDEX idx_wallet_ip_logs_created ON public.wallet_ip_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.wallet_ip_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view IP logs (security)
CREATE POLICY "Only admins can view IP logs"
ON public.wallet_ip_logs
FOR SELECT
USING (is_admin(((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)));

-- Service role can insert (edge functions)
CREATE POLICY "Service role can insert IP logs"
ON public.wallet_ip_logs
FOR INSERT
WITH CHECK (true);

-- Create function to detect multiple wallets from same IP
CREATE OR REPLACE FUNCTION public.get_wallets_by_ip(check_ip INET)
RETURNS TABLE (
  wallet_address TEXT,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  connection_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wallet_address,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen,
    COUNT(*) as connection_count
  FROM public.wallet_ip_logs
  WHERE ip_address = check_ip
  GROUP BY wallet_address
  ORDER BY connection_count DESC;
$$;

-- Create function to get IP history for a wallet
CREATE OR REPLACE FUNCTION public.get_ips_by_wallet(check_wallet TEXT)
RETURNS TABLE (
  ip_address INET,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  connection_count BIGINT,
  countries TEXT[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ip_address,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen,
    COUNT(*) as connection_count,
    ARRAY_AGG(DISTINCT country) FILTER (WHERE country IS NOT NULL) as countries
  FROM public.wallet_ip_logs
  WHERE wallet_address = check_wallet
  GROUP BY ip_address
  ORDER BY connection_count DESC;
$$;