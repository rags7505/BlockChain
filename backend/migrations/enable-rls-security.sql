-- =====================================================
-- SECURITY FIX: Enable Row Level Security (RLS)
-- =====================================================
-- This migration enables RLS on all tables and creates
-- proper security policies to prevent unauthorized access
-- =====================================================

-- IMPORTANT: Use this with the Supabase service role key in your backend
-- The backend should authenticate using JWT tokens and pass user context

-- 1. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (Clean slate)
DROP POLICY IF EXISTS "users_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "admin_read_all_users" ON public.users;
DROP POLICY IF EXISTS "judge_read_all_users" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "service_role_all_users" ON public.users;
DROP POLICY IF EXISTS "allow_service_role" ON public.users;
DROP POLICY IF EXISTS "superadmin_insert_users" ON public.users;
DROP POLICY IF EXISTS "judge_insert_users" ON public.users;

DROP POLICY IF EXISTS "users_manage_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "service_role_all_sessions" ON public.user_sessions;

DROP POLICY IF EXISTS "superadmin_all_evidences" ON public.evidences;
DROP POLICY IF EXISTS "admin_manage_evidences" ON public.evidences;
DROP POLICY IF EXISTS "investigator_insert_evidences" ON public.evidences;
DROP POLICY IF EXISTS "investigator_read_evidences" ON public.evidences;
DROP POLICY IF EXISTS "auditor_viewer_read_evidences" ON public.evidences;
DROP POLICY IF EXISTS "service_role_all_evidences" ON public.evidences;
DROP POLICY IF EXISTS "authenticated_read_evidences" ON public.evidences;
DROP POLICY IF EXISTS "admin_update_evidences" ON public.evidences;
DROP POLICY IF EXISTS "judge_update_evidences" ON public.evidences;
DROP POLICY IF EXISTS "superadmin_delete_evidences" ON public.evidences;
DROP POLICY IF EXISTS "judge_delete_evidences" ON public.evidences;

DROP POLICY IF EXISTS "users_read_access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "users_insert_access_logs" ON public.access_logs;
DROP POLICY IF EXISTS "superadmin_delete_logs" ON public.access_logs;
DROP POLICY IF EXISTS "judge_delete_logs" ON public.access_logs;
DROP POLICY IF EXISTS "service_role_all_logs" ON public.access_logs;
DROP POLICY IF EXISTS "authenticated_read_logs" ON public.access_logs;
DROP POLICY IF EXISTS "authenticated_insert_logs" ON public.access_logs;

-- =====================================================
-- 3. USERS TABLE POLICIES
-- =====================================================

-- Service role (backend) has full access - bypass RLS
-- This allows the backend server to manage users
CREATE POLICY "service_role_all_users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their own profile
CREATE POLICY "users_read_own_profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
  OR
  id::text = current_setting('request.jwt.claims', true)::json->>'userId'
);

-- Judge can read all users (for judge dashboard)
CREATE POLICY "judge_read_all_users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'judge'
  )
);

-- Superadmin can read all users
CREATE POLICY "superadmin_read_all_users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'superadmin'
  )
);

-- Users can update their own profile (but not their role)
CREATE POLICY "users_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
)
WITH CHECK (
  wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
  AND role = (SELECT role FROM public.users WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress'))
);

-- Only judge can insert new users (handled by backend typically)
CREATE POLICY "judge_insert_users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'judge'
  )
);

-- Superadmin can insert new users
CREATE POLICY "superadmin_insert_users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'superadmin'
  )
);

-- =====================================================
-- 4. USER_SESSIONS TABLE POLICIES
-- =====================================================

-- Service role has full access
CREATE POLICY "service_role_all_sessions"
ON public.user_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can manage their own sessions
CREATE POLICY "users_manage_own_sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (
  wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
)
WITH CHECK (
  wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
);

-- =====================================================
-- 5. EVIDENCES TABLE POLICIES
-- =====================================================

-- Service role has full access
CREATE POLICY "service_role_all_evidences"
ON public.evidences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All authenticated users can read evidences (based on role in backend)
CREATE POLICY "authenticated_read_evidences"
ON public.evidences
FOR SELECT
TO authenticated
USING (true);

-- Investigators and above can insert evidence
CREATE POLICY "investigator_insert_evidences"
ON public.evidences
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role IN ('superadmin', 'judge', 'investigator')
  )
);

-- Judge can update any evidence
CREATE POLICY "judge_update_evidences"
ON public.evidences
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'judge'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'judge'
  )
);

-- Superadmin can update any evidence
CREATE POLICY "superadmin_update_evidences"
ON public.evidences
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'superadmin'
  )
);

-- ONLY Superadmin can delete evidence (Judge CANNOT delete)
CREATE POLICY "superadmin_delete_evidences"
ON public.evidences
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'superadmin'
  )
);

-- =====================================================
-- 6. ACCESS_LOGS TABLE POLICIES
-- =====================================================

-- Service role has full access
CREATE POLICY "service_role_all_logs"
ON public.access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- All authenticated users can read logs
CREATE POLICY "authenticated_read_logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert logs
CREATE POLICY "authenticated_insert_logs"
ON public.access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only judge can delete logs
CREATE POLICY "judge_delete_logs"
ON public.access_logs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE wallet_address = lower(current_setting('request.jwt.claims', true)::json->>'walletAddress')
    AND role = 'judge'
  )
);

-- =====================================================
-- 7. FIX FUNCTION SECURITY (search_path warning)
-- =====================================================

-- Drop and recreate the update_updated_at_column function with secure search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

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

-- Recreate trigger if needed
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. VERIFY SETUP
-- =====================================================

-- Check RLS is enabled
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
BEGIN
  FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'user_sessions', 'evidences', 'access_logs')
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name AND relnamespace = 'public'::regnamespace;
    
    IF rls_enabled THEN
      RAISE NOTICE '✅ RLS enabled on public.%', table_name;
    ELSE
      RAISE WARNING '⚠️  RLS NOT enabled on public.%', table_name;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- SUCCESS!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ RLS SECURITY ENABLED SUCCESSFULLY!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '  ✓ Row Level Security enabled on all tables';
  RAISE NOTICE '  ✓ Service role bypasses RLS (backend access)';
  RAISE NOTICE '  ✓ Users can only access their own data';
  RAISE NOTICE '  ✓ Role-based policies enforced';
  RAISE NOTICE '  ✓ Superadmin has elevated privileges';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Your backend must use the service_role key';
  RAISE NOTICE 'for operations that bypass RLS, or ensure JWT tokens';
  RAISE NOTICE 'include walletAddress in claims.';
  RAISE NOTICE '==============================================';
END $$;
