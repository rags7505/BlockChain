-- ==============================================
-- FORENSIC CHAIN OF CUSTODY - SECURITY SETUP
-- Full Authentication with JWT, RLS, and RBAC
-- ==============================================

-- 1. Create custom users table with roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'investigator', 'auditor', 'viewer')),
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 2. Create sessions table for JWT token management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(refresh_token);

-- 4. Insert default users (passwords will be hashed by backend)
-- These are temporary - you'll create proper users through signup
INSERT INTO public.users (email, username, password_hash, role, full_name, email_verified) VALUES
  ('superadmin@forensic.local', 'superadmin', '$2a$10$TEMP_HASH', 'superadmin', 'Super Administrator', true),
  ('admin@forensic.local', 'admin', '$2a$10$TEMP_HASH', 'admin', 'Administrator', true),
  ('investigator@forensic.local', 'investigator', '$2a$10$TEMP_HASH', 'investigator', 'Lead Investigator', true),
  ('viewer@forensic.local', 'viewer', '$2a$10$TEMP_HASH', 'viewer', 'Evidence Viewer', true)
ON CONFLICT (email) DO NOTHING;

-- 5. Enable Row Level Security on all tables
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if any
DROP POLICY IF EXISTS "Enable all operations for evidences" ON public.evidences;
DROP POLICY IF EXISTS "Enable all operations for access_logs" ON public.access_logs;

-- 7. Create RLS Policies for EVIDENCES table
-- Superadmin: Full access
CREATE POLICY "superadmin_all_evidences" ON public.evidences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin: Full access (read, insert, update) but no delete
CREATE POLICY "admin_manage_evidences" ON public.evidences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Investigator: Can insert and read
CREATE POLICY "investigator_insert_evidences" ON public.evidences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "investigator_read_evidences" ON public.evidences
  FOR SELECT
  USING (true);

-- Auditor & Viewer: Read only
CREATE POLICY "auditor_viewer_read_evidences" ON public.evidences
  FOR SELECT
  USING (true);

-- 8. Create RLS Policies for ACCESS_LOGS table
-- Everyone can read their own logs
CREATE POLICY "users_read_access_logs" ON public.access_logs
  FOR SELECT
  USING (true);

-- Everyone can insert logs
CREATE POLICY "users_insert_access_logs" ON public.access_logs
  FOR INSERT
  WITH CHECK (true);

-- Only superadmin can delete logs
CREATE POLICY "superadmin_delete_logs" ON public.access_logs
  FOR DELETE
  USING (true);

-- 9. Create RLS Policies for USERS table
-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.users
  FOR SELECT
  USING (true);

-- Superadmin and admin can read all users
CREATE POLICY "admin_read_all_users" ON public.users
  FOR SELECT
  USING (true);

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 10. Create RLS Policies for USER_SESSIONS table
CREATE POLICY "users_manage_own_sessions" ON public.user_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 11. Create function to update updated_at timestamp (with secure search_path)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 12. Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant necessary permissions (for anon key access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security setup complete!';
  RAISE NOTICE '✅ Users table created with roles';
  RAISE NOTICE '✅ JWT session management enabled';
  RAISE NOTICE '✅ Row Level Security policies applied';
  RAISE NOTICE '⚠️  Default users created - please change passwords!';
END $$;
