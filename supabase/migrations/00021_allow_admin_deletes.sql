-- 00021_allow_admin_deletes.sql
-- Allow admins and officers to delete complaints, service_applications, and bills

-- Drop existing admin delete policies if they somehow exist
DROP POLICY IF EXISTS "Admins can delete complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can delete service apps" ON service_applications;
DROP POLICY IF EXISTS "Admins can delete bills" ON bills;

-- Create DELETE policies for complaints for admins/officers
CREATE POLICY "Admins can delete complaints" 
ON complaints 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'officer')
  )
);

-- Create DELETE policies for service_applications for admins/officers
CREATE POLICY "Admins can delete service apps" 
ON service_applications 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'officer')
  )
);

-- Create DELETE policies for bills for admins/officers
CREATE POLICY "Admins can delete bills" 
ON bills 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'officer')
  )
);
