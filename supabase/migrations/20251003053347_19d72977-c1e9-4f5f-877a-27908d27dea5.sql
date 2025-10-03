-- Create song ownership/purchases tracking table
CREATE TABLE public.song_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_wallet_address TEXT NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  artist_wallet_address TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view purchases"
ON public.song_purchases
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own purchases"
ON public.song_purchases
FOR INSERT
WITH CHECK (buyer_wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

-- Indexes for performance
CREATE INDEX idx_song_purchases_buyer ON public.song_purchases(buyer_wallet_address);
CREATE INDEX idx_song_purchases_artist ON public.song_purchases(artist_wallet_address);
CREATE INDEX idx_song_purchases_song ON public.song_purchases(song_id);

-- Unique constraint to prevent duplicate purchases
CREATE UNIQUE INDEX idx_song_purchases_unique ON public.song_purchases(buyer_wallet_address, song_id);

-- Function to get holders count (unique buyers of an artist's songs)
CREATE OR REPLACE FUNCTION public.get_holders_count(artist_wallet text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT buyer_wallet_address)
  FROM public.song_purchases
  WHERE artist_wallet_address = artist_wallet;
$$;

-- Function to get holdings count (unique artists whose songs a user bought)
CREATE OR REPLACE FUNCTION public.get_holdings_count(buyer_wallet text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT artist_wallet_address)
  FROM public.song_purchases
  WHERE buyer_wallet_address = buyer_wallet;
$$;