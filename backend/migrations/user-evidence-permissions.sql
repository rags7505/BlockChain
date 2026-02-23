-- Create user_evidence_permissions table
CREATE TABLE IF NOT EXISTS user_evidence_permissions (
  id SERIAL PRIMARY KEY,
  user_wallet VARCHAR(42) NOT NULL,
  evidence_id VARCHAR(255) NOT NULL,
  can_view BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_wallet, evidence_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_evidence_wallet ON user_evidence_permissions(user_wallet);
CREATE INDEX IF NOT EXISTS idx_user_evidence_id ON user_evidence_permissions(evidence_id);

-- Add comment
COMMENT ON TABLE user_evidence_permissions IS 'Tracks which evidence each user (wallet) can view';
