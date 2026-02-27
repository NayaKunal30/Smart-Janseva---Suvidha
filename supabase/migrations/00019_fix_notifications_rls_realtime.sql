-- Fix Notifications RLS to allow users to delete their own notifications
DROP POLICY IF EXISTS "notifications_delete_owner" ON public.notifications;
CREATE POLICY "notifications_delete_owner" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Explicitly enable Realtime for Notifications table
begin;
  -- remove the table from the publication first if it's there (to prevent duplicate errors)
  -- wait, safe way using pg_publication_tables 
  do $$ 
  begin
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table notifications;
    end if;
  end;
  $$;
commit;
