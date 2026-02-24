
-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  sequence_num INTEGER;
  new_application_number TEXT;
BEGIN
  -- Generate date prefix in format YYYYMMDD
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the count of applications created today + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM service_applications
  WHERE application_number LIKE 'APP-' || date_prefix || '-%';
  
  -- Generate application number: APP-YYYYMMDD-XXXX
  new_application_number := 'APP-' || date_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  -- Assign to NEW record
  NEW.application_number := new_application_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate application number before insert
DROP TRIGGER IF EXISTS trigger_generate_application_number ON service_applications;
CREATE TRIGGER trigger_generate_application_number
  BEFORE INSERT ON service_applications
  FOR EACH ROW
  WHEN (NEW.application_number IS NULL)
  EXECUTE FUNCTION generate_application_number();
