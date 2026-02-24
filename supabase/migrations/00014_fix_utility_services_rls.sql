-- Fix for utility_services RLS and Complaint Status Visibility

-- 1. UTILITY SERVICES ADMIN ACCESS
-- Allow admins and officers to manage all utility service records
DROP POLICY IF EXISTS "services_admin_all" ON public.utility_services;
CREATE POLICY "services_admin_all" ON public.utility_services FOR ALL USING (public.is_officer()) WITH CHECK (public.is_officer());

-- 2. NOTIFICATIONS FIX
-- Ensure admins can read the notifications they sent (optional but good for debugging)
DROP POLICY IF EXISTS "notifications_admin_select" ON public.notifications;
CREATE POLICY "notifications_admin_select" ON public.notifications FOR SELECT USING (public.is_officer());

-- 3. ENSURE Profiles role is checked efficiently
-- (Already handled by is_officer() function in 00013)

-- 4. FIX COMPLAINT STATUS ENUM NAMES IN CODE
-- No SQL changes needed for this, just frontend.

-- 5. REFRESH RLS ON UTILITY SERVICES
ALTER TABLE public.utility_services ENABLE ROW LEVEL SECURITY;
