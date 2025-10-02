-- Make user_id nullable since we're using wallet_address as primary identifier
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;