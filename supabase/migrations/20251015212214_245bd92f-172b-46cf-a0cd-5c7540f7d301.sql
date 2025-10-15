-- Add INSERT policy for verification_requests so users can submit their own requests
CREATE POLICY "Users can create their own verification requests"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (wallet_address = get_wallet_from_jwt());