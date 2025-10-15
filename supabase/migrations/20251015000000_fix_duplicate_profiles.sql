-- Fix duplicate profiles caused by case-insensitive wallet addresses
-- This migration:
-- 1. Normalizes all wallet addresses to lowercase
-- 2. Merges duplicate profiles, keeping the most recent one
-- 3. Ensures no future duplicates can be created

-- Step 1: Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_wallets AS
SELECT 
  LOWER(wallet_address) as normalized_address,
  COUNT(*) as count,
  ARRAY_AGG(wallet_address ORDER BY created_at DESC) as addresses,
  ARRAY_AGG(id ORDER BY created_at DESC) as ids
FROM profiles
WHERE wallet_address IS NOT NULL
GROUP BY LOWER(wallet_address)
HAVING COUNT(*) > 1;

-- Step 2: For each duplicate, keep the most recent profile and delete older ones
DO $$
DECLARE
  dup_record RECORD;
  keep_id UUID;
  delete_ids UUID[];
BEGIN
  FOR dup_record IN SELECT * FROM duplicate_wallets LOOP
    -- Keep the first ID (most recent), delete the rest
    keep_id := dup_record.ids[1];
    delete_ids := dup_record.ids[2:array_length(dup_record.ids, 1)];
    
    -- Log what we're doing
    RAISE NOTICE 'Keeping profile % for wallet %, deleting %', 
      keep_id, dup_record.normalized_address, delete_ids;
    
    -- Delete the duplicate profiles
    DELETE FROM profiles WHERE id = ANY(delete_ids);
    
    -- Update the kept profile to have lowercase wallet address
    UPDATE profiles 
    SET wallet_address = dup_record.normalized_address
    WHERE id = keep_id;
  END LOOP;
END $$;

-- Step 3: Normalize all remaining wallet addresses to lowercase
UPDATE profiles
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address IS NOT NULL 
  AND wallet_address != LOWER(wallet_address);

-- Step 4: Add a constraint to ensure wallet addresses are always lowercase
-- First, drop the existing unique constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS unique_wallet_address;

-- Create a function to ensure lowercase wallet addresses
CREATE OR REPLACE FUNCTION ensure_lowercase_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address := LOWER(NEW.wallet_address);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically lowercase wallet addresses on insert/update
DROP TRIGGER IF EXISTS lowercase_wallet_trigger ON profiles;
CREATE TRIGGER lowercase_wallet_trigger
  BEFORE INSERT OR UPDATE OF wallet_address ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_lowercase_wallet();

-- Re-add the unique constraint (now that all addresses are lowercase)
ALTER TABLE profiles 
  ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- Step 5: Create an index for case-insensitive lookups (for safety)
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_lower 
  ON profiles (LOWER(wallet_address));

-- Log completion
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE wallet_address IS NOT NULL;
  RAISE NOTICE 'Migration complete. Total profiles with wallet addresses: %', profile_count;
END $$;


