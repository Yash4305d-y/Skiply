-- ==============================================================================
-- 6. FCM Tokens Table (For Push Notifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_tokens(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON fcm_tokens;
CREATE TRIGGER update_fcm_tokens_updated_at 
BEFORE UPDATE ON fcm_tokens 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can view own fcm tokens" ON fcm_tokens FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can insert own fcm tokens" ON fcm_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can delete own fcm tokens" ON fcm_tokens FOR DELETE USING (auth.uid() = user_id);
