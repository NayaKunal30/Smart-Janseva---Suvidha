-- Fix NOT NULL constraints on utility_services columns that admin doesn't always provide
ALTER TABLE public.utility_services ALTER COLUMN service_number SET DEFAULT 'SVC-' || gen_random_uuid()::text;
ALTER TABLE public.utility_services ALTER COLUMN service_number DROP NOT NULL;
ALTER TABLE public.utility_services ALTER COLUMN provider_name SET DEFAULT 'Municipal Corporation';
ALTER TABLE public.utility_services ALTER COLUMN provider_name DROP NOT NULL;
ALTER TABLE public.utility_services ALTER COLUMN connection_address SET DEFAULT '';
ALTER TABLE public.utility_services ALTER COLUMN connection_address DROP NOT NULL;

-- Also ensure payments table has proper RLS for citizen inserts
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_owner_select" ON public.payments;
CREATE POLICY "payments_owner_select" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_owner_insert" ON public.payments;
CREATE POLICY "payments_owner_insert" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (public.is_officer());

-- Bills: allow citizen to update their own bill status (for payment)
DROP POLICY IF EXISTS "bills_owner_update" ON public.bills;
CREATE POLICY "bills_owner_update" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
