-- Create storage bucket for stories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Storage policies for stories bucket
CREATE POLICY "Anyone can view stories"
ON storage.objects
FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'stories' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own stories"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'stories' AND
  auth.role() = 'authenticated'
);

-- Update stories table to use storage path instead of CID
ALTER TABLE public.stories DROP COLUMN media_cid;
ALTER TABLE public.stories ADD COLUMN media_path TEXT NOT NULL DEFAULT '';

-- Create function to cleanup expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  expired_story RECORD;
BEGIN
  -- Delete expired story files from storage and database
  FOR expired_story IN 
    SELECT id, media_path 
    FROM public.stories 
    WHERE expires_at < now()
  LOOP
    -- Delete from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'stories' 
    AND name = expired_story.media_path;
    
    -- Delete from database
    DELETE FROM public.stories 
    WHERE id = expired_story.id;
  END LOOP;
END;
$$;