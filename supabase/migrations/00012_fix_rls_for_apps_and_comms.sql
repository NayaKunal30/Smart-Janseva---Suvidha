-- Add missing RLS policies for service applications, announcements and notifications
-- This fixes the "Failed to submit application" and "Announcements not working" issues.

-- 1. SERVICE APPLICATIONS
ALTER TABLE public.service_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_apps_select_owner" ON public.service_applications;
CREATE POLICY "service_apps_select_owner" ON public.service_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_apps_insert_owner" ON public.service_applications;
CREATE POLICY "service_apps_insert_owner" ON public.service_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_apps_admin_all" ON public.service_applications;
CREATE POLICY "service_apps_admin_all" ON public.service_applications FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'officer')
);

-- 2. ANNOUNCEMENTS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select_all" ON public.announcements;
CREATE POLICY "announcements_select_all" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;
CREATE POLICY "announcements_admin_all" ON public.announcements FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'officer')
);

-- 3. NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_owner" ON public.notifications;
CREATE POLICY "notifications_select_owner" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_owner" ON public.notifications;
CREATE POLICY "notifications_update_owner" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_admin_insert" ON public.notifications;
CREATE POLICY "notifications_admin_insert" ON public.notifications FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'officer')
);
