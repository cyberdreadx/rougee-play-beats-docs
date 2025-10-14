-- Allow artists to update their own songs (needed to save token_address after deploy)
CREATE POLICY "Users can update their own songs"
ON public.songs
FOR UPDATE
USING (wallet_address = public.get_wallet_from_jwt())
WITH CHECK (wallet_address = public.get_wallet_from_jwt());