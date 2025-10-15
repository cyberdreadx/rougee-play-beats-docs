-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can create their own verification requests" ON public.verification_requests;

-- Create correct policy that works with Privy authentication
CREATE POLICY "Users can create their own verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (wallet_address = get_wallet_from_jwt());