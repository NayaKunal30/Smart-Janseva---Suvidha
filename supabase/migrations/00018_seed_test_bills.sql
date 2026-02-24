-- Insert a pending test bill for user suvidha@gmail.com (861ba134-92b2-469f-aa39-0592f16f8d99)
-- First create a utility service for it
INSERT INTO public.utility_services (id, user_id, service_name, utility_type, service_number, provider_name, connection_address, is_active)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', '861ba134-92b2-469f-aa39-0592f16f8d99', 'Electricity', 'electricity', 'SVC-ELEC-001', 'Suvidha Municipal Corporation', 'On Record', true),
  ('a2222222-2222-2222-2222-222222222222', '861ba134-92b2-469f-aa39-0592f16f8d99', 'Property Tax', 'municipal', 'SVC-TAX-001', 'Suvidha Municipal Corporation', 'On Record', true),
  ('a3333333-3333-3333-3333-333333333333', '6e688ea0-aa72-4f15-96b2-5850bdf1d9bb', 'Water Supply', 'water', 'SVC-WATER-002', 'Suvidha Municipal Corporation', 'On Record', true)
ON CONFLICT (id) DO NOTHING;

-- Insert pending bills
INSERT INTO public.bills (id, user_id, utility_service_id, bill_number, bill_date, due_date, amount, billing_period_start, billing_period_end, status)
VALUES
  ('b1111111-1111-1111-1111-111111111111', '861ba134-92b2-469f-aa39-0592f16f8d99', 'a1111111-1111-1111-1111-111111111111', 'BILL-ELEC-2026-001', '2026-02-24', '2026-03-15', 2450.00, '2026-02-01', '2026-02-28', 'pending'),
  ('b2222222-2222-2222-2222-222222222222', '861ba134-92b2-469f-aa39-0592f16f8d99', 'a2222222-2222-2222-2222-222222222222', 'BILL-TAX-2026-001', '2026-02-24', '2026-03-31', 5600.00, '2026-01-01', '2026-03-31', 'pending'),
  ('b3333333-3333-3333-3333-333333333333', '6e688ea0-aa72-4f15-96b2-5850bdf1d9bb', 'a3333333-3333-3333-3333-333333333333', 'BILL-WATER-2026-001', '2026-02-24', '2026-03-10', 780.00, '2026-02-01', '2026-02-28', 'pending')
ON CONFLICT (id) DO NOTHING;
