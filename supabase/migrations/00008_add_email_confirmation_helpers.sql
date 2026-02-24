
-- Helper function to confirm user email manually
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auth.users to set email_confirmed_at
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW(),
      last_sign_in_at = NOW()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO anon, authenticated;

-- Trigger to automatically confirm emails for the developer's email
CREATE OR REPLACE FUNCTION public.auto_confirm_dev_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'kunalnayak3004@gmail.com' THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_confirm_dev_email ON auth.users;
CREATE TRIGGER trigger_auto_confirm_dev_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_dev_email();
