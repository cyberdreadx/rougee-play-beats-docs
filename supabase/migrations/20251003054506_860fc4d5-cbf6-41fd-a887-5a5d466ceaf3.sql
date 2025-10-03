-- Create enum for report types
CREATE TYPE public.report_type AS ENUM ('copyright', 'hate_speech', 'other');

-- Create song reports table
CREATE TABLE public.song_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  report_type public.report_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert reports"
ON public.song_reports
FOR INSERT
WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Only admins can view reports"
ON public.song_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)
    AND role = 'admin'
  )
);

-- Indexes
CREATE INDEX idx_song_reports_song ON public.song_reports(song_id);
CREATE INDEX idx_song_reports_wallet ON public.song_reports(wallet_address);