-- Fix the RLS policy for verification requests
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create verification requests" ON public.verification_requests;

-- Create a simpler policy that just checks the wallet_address is provided
CREATE POLICY "Users can create verification requests" 
ON public.verification_requests
FOR INSERT
WITH CHECK (
  wallet_address IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 
    FROM verification_requests vr 
    WHERE vr.wallet_address = verification_requests.wallet_address 
    AND vr.status = 'pending'
  )
);