-- Add new columns for privileged user functionality
ALTER TABLE usr_user 
ADD COLUMN affiliation VARCHAR(100),
ADD COLUMN identification_number VARCHAR(100),
ADD COLUMN registration_number VARCHAR(100),
ADD COLUMN affiliation_doc TEXT;

-- Add indexes for performance
CREATE INDEX idx_affiliation ON usr_user(affiliation);
CREATE INDEX idx_identification_number ON usr_user(identification_number);
CREATE INDEX idx_registration_number ON usr_user(registration_number);
