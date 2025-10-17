-- Delete the duplicate lowercase profile created by the bug
DELETE FROM profiles WHERE id = '6b13dcb9-863d-4dcd-9c5a-a0c59c2daca7';

-- Create a function to normalize wallet addresses for uniqueness
CREATE OR REPLACE FUNCTION normalize_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.wallet_address = LOWER(NEW.wallet_address);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically lowercase wallet addresses on insert/update
DROP TRIGGER IF EXISTS normalize_wallet_trigger ON profiles;
CREATE TRIGGER normalize_wallet_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION normalize_wallet_address();