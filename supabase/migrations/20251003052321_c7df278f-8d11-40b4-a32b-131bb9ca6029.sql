-- Create copyright violations tracking table
CREATE TABLE public.copyright_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  song_title TEXT,
  artist_name TEXT,
  album TEXT,
  label TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acr_response JSONB,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copyright_violations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own violations
CREATE POLICY "Users can view their own violations"
ON public.copyright_violations
FOR SELECT
USING (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

-- Only system can insert violations (via edge function with service role)
CREATE POLICY "Service role can insert violations"
ON public.copyright_violations
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_copyright_violations_wallet ON public.copyright_violations(wallet_address);
CREATE INDEX idx_copyright_violations_detected_at ON public.copyright_violations(detected_at DESC);