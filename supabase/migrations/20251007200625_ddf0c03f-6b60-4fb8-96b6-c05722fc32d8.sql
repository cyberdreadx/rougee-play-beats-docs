-- Create artist_tokens table to track deployed tokens
CREATE TABLE public.artist_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  total_supply TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 8453,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address)
);

-- Enable RLS
ALTER TABLE public.artist_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can view tokens
CREATE POLICY "Anyone can view artist tokens"
ON public.artist_tokens
FOR SELECT
USING (true);

-- Users can insert their own token (one time only enforced by UNIQUE constraint)
CREATE POLICY "Users can create their own artist token"
ON public.artist_tokens
FOR INSERT
WITH CHECK (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));