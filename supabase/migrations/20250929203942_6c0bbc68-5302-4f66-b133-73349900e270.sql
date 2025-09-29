-- Add delete policy for songs - only admins can delete
CREATE POLICY "Only admins can delete songs" 
ON public.songs 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add insert policy for songs (for completeness)
CREATE POLICY "Authenticated users can insert songs" 
ON public.songs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);