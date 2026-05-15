-- Migration: Switch to wallet-based authentication
-- Run this in Supabase SQL Editor

-- Drop old users table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Create new users table with wallet addresses
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL, -- Ethereum address 0x...
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'judge', 'investigator', 'viewer')),
  display_name VARCHAR(100), -- Optional display name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Create index on wallet address for fast lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Insert default users (Hardhat development accounts)
-- Note: Wallet addresses stored in lowercase for consistency
INSERT INTO users (wallet_address, role, display_name) VALUES
  ('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'superadmin', 'Superadmin'),
  ('0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 'judge', 'Judge'),
  ('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 'investigator', 'Investigator 2'),
  ('0x90f79bf6eb2c4f870365e785982e1f101e93b906', 'viewer', 'Viewer');

-- Create sessions table for wallet auth
DROP TABLE IF EXISTS user_sessions CASCADE;
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  nonce TEXT, -- For signature verification
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_wallet ON user_sessions(wallet_address);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);

-- RLS Policies (Disabled for simpler backend management)
-- Backend uses service role key which bypasses RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON user_sessions TO anon, authenticated;

COMMENT ON TABLE users IS 'Stores wallet addresses and their assigned roles';
COMMENT ON TABLE user_sessions IS 'Manages authenticated wallet sessions with JWT tokens';
