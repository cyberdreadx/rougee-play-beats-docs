-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  media_cid TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view non-expired stories"
ON public.stories
FOR SELECT
USING (expires_at > now());

CREATE POLICY "Authenticated users can create stories"
ON public.stories
FOR INSERT
WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

-- Create index for performance
CREATE INDEX idx_stories_wallet_address ON public.stories(wallet_address);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);

-- Trigger for updated_at
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();