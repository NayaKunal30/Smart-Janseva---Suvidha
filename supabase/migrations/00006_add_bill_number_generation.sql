
-- Function to generate bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  sequence_num INTEGER;
  new_bill_number TEXT;
BEGIN
  -- Generate date prefix in format YYYYMMDD
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the count of bills created today + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM bills
  WHERE bill_number LIKE 'BILL-' || date_prefix || '-%';
  
  -- Generate bill number: BILL-YYYYMMDD-XXXX
  new_bill_number := 'BILL-' || date_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  -- Assign to NEW record
  NEW.bill_number := new_bill_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate bill number before insert
DROP TRIGGER IF EXISTS trigger_generate_bill_number ON bills;
CREATE TRIGGER trigger_generate_bill_number
  BEFORE INSERT ON bills
  FOR EACH ROW
  WHEN (NEW.bill_number IS NULL)
  EXECUTE FUNCTION generate_bill_number();
