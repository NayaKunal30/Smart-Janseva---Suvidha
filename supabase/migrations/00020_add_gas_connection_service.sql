DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.service_types WHERE name = 'Gas Connection') THEN
        INSERT INTO public.service_types (name, description, icon, form_schema, required_documents, processing_time_days)
        VALUES (
            'Gas Connection', 
            'New PNG/LPG connection for residential and commercial', 
            '🔥',
            '{
                "fields": [
                    {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
                    {"name": "address", "label": "Installation Address", "type": "textarea", "required": true},
                    {"name": "connection_type", "label": "Connection Type", "type": "select", "options": ["PNG (Piped Natural Gas)", "LPG (Liquefied Petroleum Gas)"], "required": true},
                    {"name": "consumer_category", "label": "Consumer Category", "type": "select", "options": ["Domestic", "Commercial", "Industrial"], "required": true}
                ]
            }'::jsonb,
            ARRAY['Aadhar Card', 'Address Proof', 'No Objection Certificate (NOC)', 'Bank Passbook'],
            10
        );
    ELSE
        -- Update existing if needed
        UPDATE public.service_types
        SET 
            form_schema = '{
                "fields": [
                    {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
                    {"name": "address", "label": "Installation Address", "type": "textarea", "required": true},
                    {"name": "connection_type", "label": "Connection Type", "type": "select", "options": ["PNG (Piped Natural Gas)", "LPG (Liquefied Petroleum Gas)"], "required": true},
                    {"name": "consumer_category", "label": "Consumer Category", "type": "select", "options": ["Domestic", "Commercial", "Industrial"], "required": true}
                ]
            }'::jsonb,
            required_documents = ARRAY['Aadhar Card', 'Address Proof', 'No Objection Certificate (NOC)', 'Bank Passbook'],
            processing_time_days = 10
        WHERE name = 'Gas Connection';
    END IF;
END $$;
