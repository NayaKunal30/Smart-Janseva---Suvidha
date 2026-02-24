-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Update the handle_new_user function to respect role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INT;
  user_role user_role;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Check if role is specified in metadata, otherwise use default
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSIF user_count = 0 THEN
    user_role := 'admin'::user_role;
  ELSE
    user_role := 'citizen'::user_role;
  END IF;
  
  INSERT INTO public.profiles (id, email, phone, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_confirmed
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();