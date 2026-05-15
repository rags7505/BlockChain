-- Migration: Add current_holder column to evidences table
-- This tracks who currently holds custody of the evidence (can be different from uploader)

-- Add current_holder column if it doesn't exist
ALTER TABLE evidences 
ADD COLUMN IF NOT EXISTS current_holder TEXT;

-- Set default value for existing rows (current_holder = uploaded_by initially)
UPDATE evidences 
SET current_holder = uploaded_by 
WHERE current_holder IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_evidences_current_holder ON evidences(current_holder);

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'evidences'
AND column_name = 'current_holder';
