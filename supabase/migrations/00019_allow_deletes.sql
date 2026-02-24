-- 00019_allow_deletes.sql
-- Allow citizens to delete their own complaints and service applications

-- Drop existing delete policies if they somehow exist
DROP POLICY IF EXISTS "Users can delete own complaints" ON complaints;
DROP POLICY IF EXISTS "Users can delete own service apps" ON service_applications;

-- Create DELETE policies for complaints
CREATE POLICY "Users can delete own complaints" 
ON complaints 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create DELETE policies for service_applications
CREATE POLICY "Users can delete own service apps" 
ON service_applications 
FOR DELETE 
USING (auth.uid() = user_id);
