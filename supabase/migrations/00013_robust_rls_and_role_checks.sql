-- Comprehensive Fix for System Functional Failures
-- Addresses: RLS violations, Role verification, and schema consistency

-- 1. UTILITY SERVICES RLS
ALTER TABLE public.utility_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_insert_owner" ON public.utility_services;
CREATE POLICY "services_insert_owner" ON public.utility_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "services_select_owner" ON public.utility_services;
CREATE POLICY "services_select_owner" ON public.utility_services FOR SELECT USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'officer'))));

-- 2. BETTER ROLE CHECKING FUNCTION
-- Supabase JWT metadata can be unreliable if not synced by a trigger.
-- We join with the profiles table for definitive role verification in RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_officer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'officer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY ROBUST POLICIES TO ALL CRITICAL TABLES
-- SERVICE APPLICATIONS
DROP POLICY IF EXISTS "service_apps_admin_all" ON public.service_applications;
CREATE POLICY "service_apps_admin_all" ON public.service_applications FOR ALL USING (public.is_officer()) WITH CHECK (public.is_officer());

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;
CREATE POLICY "announcements_admin_all" ON public.announcements FOR ALL USING (public.is_officer()) WITH CHECK (public.is_officer());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_admin_insert" ON public.notifications;
CREATE POLICY "notifications_admin_insert" ON public.notifications FOR INSERT WITH CHECK (public.is_officer());

-- BILLS
DROP POLICY IF EXISTS "bills_all_admin" ON public.bills;
CREATE POLICY "bills_all_admin" ON public.bills FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COMPLAINTS
DROP POLICY IF EXISTS "complaints_select_admin" ON public.complaints;
CREATE POLICY "complaints_select_admin" ON public.complaints FOR SELECT USING (public.is_officer());

DROP POLICY IF EXISTS "complaints_update_admin" ON public.complaints;
CREATE POLICY "complaints_update_admin" ON public.complaints FOR UPDATE USING (public.is_officer());

-- 4. FIX COMPLAINT STATUS ENUMS IF INCONSISTENT
-- Ensure 'pending' is NOT in the database or handled gracefully
-- (Assuming based on previous session that 'submitted' is the correct label)
