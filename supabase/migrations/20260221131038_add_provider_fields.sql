-- Add provider-specific fields to user_profiles (for backward compatibility)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS practice_name TEXT,
ADD COLUMN IF NOT EXISTS primary_specialty TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';

-- Update existing rows: copy email from auth.users (requires trigger or manual update)
-- We'll rely on application logic to populate email from auth.users
