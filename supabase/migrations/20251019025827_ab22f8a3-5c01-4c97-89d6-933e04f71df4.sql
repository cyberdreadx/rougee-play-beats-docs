-- Add AI generation label to songs table
CREATE TYPE public.ai_usage_type AS ENUM ('none', 'partial', 'full');

ALTER TABLE public.songs
ADD COLUMN ai_usage public.ai_usage_type NOT NULL DEFAULT 'none';