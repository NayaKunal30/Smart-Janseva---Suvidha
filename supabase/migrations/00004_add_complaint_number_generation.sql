
-- Function to generate complaint number
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  sequence_num INTEGER;
  new_complaint_number TEXT;
BEGIN
  -- Generate date prefix in format YYYYMMDD
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the count of complaints created today + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM complaints
  WHERE complaint_number LIKE 'CMP-' || date_prefix || '-%';
  
  -- Generate complaint number: CMP-YYYYMMDD-XXXX
  new_complaint_number := 'CMP-' || date_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  -- Assign to NEW record
  NEW.complaint_number := new_complaint_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate complaint number before insert
DROP TRIGGER IF EXISTS trigger_generate_complaint_number ON complaints;
CREATE TRIGGER trigger_generate_complaint_number
  BEFORE INSERT ON complaints
  FOR EACH ROW
  WHEN (NEW.complaint_number IS NULL)
  EXECUTE FUNCTION generate_complaint_number();

-- Also update the SLA deadline based on priority
CREATE OR REPLACE FUNCTION set_complaint_sla()
RETURNS TRIGGER AS $$
BEGIN
  -- Set SLA deadline based on priority
  IF NEW.priority = 'urgent' THEN
    NEW.sla_deadline := NOW() + INTERVAL '24 hours';
  ELSIF NEW.priority = 'high' THEN
    NEW.sla_deadline := NOW() + INTERVAL '3 days';
  ELSIF NEW.priority = 'medium' THEN
    NEW.sla_deadline := NOW() + INTERVAL '7 days';
  ELSE -- low
    NEW.sla_deadline := NOW() + INTERVAL '14 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SLA
DROP TRIGGER IF EXISTS trigger_set_complaint_sla ON complaints;
CREATE TRIGGER trigger_set_complaint_sla
  BEFORE INSERT ON complaints
  FOR EACH ROW
  WHEN (NEW.sla_deadline IS NULL)
  EXECUTE FUNCTION set_complaint_sla();
