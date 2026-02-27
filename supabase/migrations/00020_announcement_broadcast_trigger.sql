CREATE OR REPLACE FUNCTION public.broadcast_announcement()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
  SELECT 
    id AS user_id, 
    NEW.title, 
    NEW.content AS message, 
    'announcement'::notification_type, 
    false AS is_read,
    NEW.created_at
  FROM public.profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
