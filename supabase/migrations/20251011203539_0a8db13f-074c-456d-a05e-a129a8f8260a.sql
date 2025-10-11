-- Function to sync profile role to user_roles table
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if wallet_address and role exist
  IF NEW.wallet_address IS NOT NULL AND NEW.role IS NOT NULL THEN
    -- Insert or update the user_roles entry
    INSERT INTO public.user_roles (wallet_address, role)
    VALUES (NEW.wallet_address, NEW.role::app_role)
    ON CONFLICT (wallet_address, role) 
    DO NOTHING;
    
    -- If role changed from old value, remove old role entry
    IF TG_OP = 'UPDATE' AND OLD.role IS NOT NULL AND OLD.role != NEW.role THEN
      DELETE FROM public.user_roles 
      WHERE wallet_address = NEW.wallet_address 
      AND role = OLD.role::app_role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.profiles;
CREATE TRIGGER sync_profile_role_trigger
  AFTER INSERT OR UPDATE OF role, wallet_address ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_user_roles();

-- Backfill existing profiles into user_roles
INSERT INTO public.user_roles (wallet_address, role)
SELECT wallet_address, role::app_role
FROM public.profiles
WHERE wallet_address IS NOT NULL 
  AND role IS NOT NULL
ON CONFLICT (wallet_address, role) DO NOTHING;