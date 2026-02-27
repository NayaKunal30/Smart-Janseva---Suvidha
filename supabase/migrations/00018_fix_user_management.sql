-- Fix handle_new_user to not overwrite roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role user_role;
  meta_role text;
BEGIN
  -- Extract role from metadata
  meta_role := NEW.raw_user_meta_data->>'role';
  
  -- Determine role with safe casting
  BEGIN
    IF meta_role IS NOT NULL AND meta_role IN ('citizen', 'officer', 'admin') THEN
      user_role := meta_role::user_role;
    ELSE
      -- Fallback: if first user, make admin, else citizen
      IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
        user_role := 'admin'::user_role;
      ELSE
        user_role := 'citizen'::user_role;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_role := 'citizen'::user_role;
  END;

  -- Insert or Update profile without overriding existing role
  INSERT INTO public.profiles (id, email, phone, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    -- role = EXCLUDED.role, -- DO NOT OVERWRITE ROLE ON UPDATE, so Admin changes stay!
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;
