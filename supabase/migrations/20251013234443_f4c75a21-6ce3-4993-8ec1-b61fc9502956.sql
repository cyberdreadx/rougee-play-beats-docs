-- Add token_address column to songs table
ALTER TABLE public.songs
ADD COLUMN token_address text;

-- Create index for faster lookups by token address
CREATE INDEX idx_songs_token_address ON public.songs(token_address);

-- Add comment for documentation
COMMENT ON COLUMN public.songs.token_address IS 'Smart contract address of the deployed song token on Base mainnet';