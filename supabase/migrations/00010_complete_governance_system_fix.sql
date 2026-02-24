-- COMPLETE GOVERNANCE SYSTEM FIX V2
-- This version fixes RLS recursion which causes 500 errors

-- 1. UTILITY SERVICES
CREATE TABLE IF NOT EXISTS public.utility_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    service_name TEXT NOT NULL,
    utility_type TEXT NOT NULL,
    provider_name TEXT,
    account_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BILLS
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    service_id UUID REFERENCES public.utility_services(id),
    bill_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
    month TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    bill_id UUID REFERENCES public.bills(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'upi',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CLEAN UP RLS POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 5. ROBUST RLS POLICIES (No Recursion)

-- PROFILES
CREATE POLICY "profiles_select_owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);
-- Admin access via metadata to avoid recursion
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- COMPLAINTS
CREATE POLICY "complaints_select_owner" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "complaints_insert_owner" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "complaints_update_owner" ON public.complaints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "complaints_select_admin" ON public.complaints FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'officer')
);

-- BILLS
CREATE POLICY "bills_select_owner" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bills_all_admin" ON public.bills FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- PAYMENTS
CREATE POLICY "payments_select_owner" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_owner" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UTILITY SERVICES
CREATE POLICY "services_select_owner" ON public.utility_services FOR SELECT USING (auth.uid() = user_id);

-- 6. ENSURE COLUMNS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='utility_services' AND column_name='account_number') THEN
        ALTER TABLE public.utility_services ADD COLUMN account_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='status') THEN
        ALTER TABLE public.complaints ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;
