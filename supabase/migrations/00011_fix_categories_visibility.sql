-- FIX FOR CATEGORIES VISIBILITY
-- Allows everyone to view categories and service types

-- 1. COMPLAINT CATEGORIES POLICY
ALTER TABLE public.complaint_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.complaint_categories;
CREATE POLICY "Categories are viewable by everyone" ON public.complaint_categories FOR SELECT USING (true);

-- 2. SERVICE TYPES (If table exists from turn 480/527)
CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service types are viewable by everyone" ON public.service_types;
CREATE POLICY "Service types are viewable by everyone" ON public.service_types FOR SELECT USING (true);

-- 3. SEED DATA FOR SERVICE TYPES (If empty)
INSERT INTO public.service_types (name, description, icon)
VALUES 
('Water Connection', 'Apply for new water connection or change existing one', '🚰'),
('Electricity Connection', 'New power line or meter replacement services', '⚡'),
('Ration Card', 'Apply for new or renew your food security card', '🌾'),
('Property Tax', 'Self-assessment and property documentation', '🏠'),
('Birth Certificate', 'Registration and issuance of birth records', '👶'),
('Death Certificate', 'Official registration of death records', '🕊️')
ON CONFLICT DO NOTHING;
