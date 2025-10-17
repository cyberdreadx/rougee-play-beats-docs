-- Normalize existing wallet addresses to lowercase
UPDATE public.profiles
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address IS NOT NULL;

-- Ensure function has secure search_path and schema-qualified name
CREATE OR REPLACE FUNCTION public.normalize_wallet_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address = LOWER(NEW.wallet_address);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger to call the schema-qualified function
DROP TRIGGER IF EXISTS normalize_wallet_trigger ON public.profiles;
CREATE TRIGGER normalize_wallet_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_wallet_address();

-- Add unique index on lower(wallet_address) to prevent case variants duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet_lower
ON public.profiles ((LOWER(wallet_address)))
WHERE wallet_address IS NOT NULL;