-- Create ads table for radio advertisements
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  audio_cid TEXT NOT NULL,
  image_cid TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active ads
CREATE POLICY "Anyone can view active ads"
  ON public.ads
  FOR SELECT
  USING (active = true);

-- Only admins can manage ads
CREATE POLICY "Admins can manage ads"
  ON public.ads
  FOR ALL
  USING (public.is_admin(current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Create trigger for updated_at
CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();