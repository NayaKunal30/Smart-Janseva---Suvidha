-- Fix for Profiles RLS visibility for Admins/Officers
-- This ensures that Admins can see citizen names in all dashboards.

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_officer());

-- Also allow admins to update roles
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Ensure utility_services admin access is broad
DROP POLICY IF EXISTS "services_admin_all" ON public.utility_services;
CREATE POLICY "services_admin_all" ON public.utility_services FOR ALL USING (public.is_officer()) WITH CHECK (public.is_officer());
