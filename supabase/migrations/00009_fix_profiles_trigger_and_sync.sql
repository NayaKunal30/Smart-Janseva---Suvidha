-- MASTER FIX: robust trigger and sync for profiles

-- 1. Ensure the trigger function is robust
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

  -- Insert or Update profile
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
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;

-- 2. Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. SYNC: Backfill any missing profiles for existing users
DO $$
DECLARE
  u RECORD;
  u_role user_role;
  u_meta_role text;
BEGIN
  FOR u IN 
    SELECT id, email, phone, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    u_meta_role := u.raw_user_meta_data->>'role';
    
    IF u_meta_role IS NOT NULL AND u_meta_role IN ('citizen', 'officer', 'admin') THEN
      u_role := u_meta_role::user_role;
    ELSE
      u_role := 'citizen'::user_role;
    END IF;

    INSERT INTO public.profiles (id, email, phone, role, full_name)
    VALUES (
      u.id,
      u.email,
      COALESCE(u.phone, u.raw_user_meta_data->>'phone', ''),
      u_role,
      COALESCE(u.raw_user_meta_data->>'full_name', 'User')
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- 4. Ensure RLS Policies are correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow insert during registration (if trigger fails)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow public read of select fields (optional, for admin/officer identification)
DROP POLICY IF EXISTS "Public profiles are semi-visible" ON public.profiles;
CREATE POLICY "Public profiles are semi-visible" 
  ON public.profiles FOR SELECT 
  USING (true);
