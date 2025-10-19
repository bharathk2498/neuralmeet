-- Avatar Training and Display Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. AVATAR TRAINING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clone_id UUID REFERENCES user_clones(id) ON DELETE CASCADE NOT NULL,
    
    -- External API IDs (HeyGen, D-ID, etc)
    provider TEXT DEFAULT 'heygen', -- heygen, d-id, synthesia
    provider_avatar_id TEXT,
    provider_voice_id TEXT,
    
    -- Training status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'training', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Media URLs (results from AI service)
    avatar_video_url TEXT,
    avatar_thumbnail_url TEXT,
    sample_video_url TEXT,
    
    -- Timestamps
    training_started_at TIMESTAMPTZ,
    training_completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AVATAR DISPLAY SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_display_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    avatar_training_id UUID REFERENCES avatar_training(id) ON DELETE SET NULL,
    
    -- Display preferences
    show_avatar BOOLEAN DEFAULT true,
    avatar_size TEXT DEFAULT 'medium' CHECK (avatar_size IN ('small', 'medium', 'large')),
    avatar_position TEXT DEFAULT 'bottom-right' CHECK (avatar_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
    
    -- Behavior
    auto_greet BOOLEAN DEFAULT true,
    greeting_message TEXT DEFAULT 'Hi! I''m your AI assistant. How can I help you today?',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. WEBHOOK LOGS (debugging)
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avatar_training_id UUID REFERENCES avatar_training(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_avatar_training_user 
ON avatar_training(user_id);

CREATE INDEX IF NOT EXISTS idx_avatar_training_status 
ON avatar_training(status);

CREATE INDEX IF NOT EXISTS idx_avatar_training_clone 
ON avatar_training(clone_id);

CREATE INDEX IF NOT EXISTS idx_avatar_webhooks_training 
ON avatar_webhooks(avatar_training_id);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE avatar_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_webhooks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own avatars
CREATE POLICY "Users view own avatars"
ON avatar_training FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users create own avatars"
ON avatar_training FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own display settings"
ON avatar_display_settings FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Service role can manage webhooks
CREATE POLICY "Service role manages webhooks"
ON avatar_webhooks FOR ALL
TO service_role
USING (true);

-- ============================================
-- 6. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER avatar_training_updated_at
    BEFORE UPDATE ON avatar_training
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER avatar_display_updated_at
    BEFORE UPDATE ON avatar_display_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. UPDATE user_clones TABLE
-- ============================================

-- Add avatar_ready flag to existing user_clones table
ALTER TABLE user_clones 
ADD COLUMN IF NOT EXISTS avatar_ready BOOLEAN DEFAULT false;

ALTER TABLE user_clones
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- 8. VERIFY SETUP
-- ============================================

-- Check tables exist
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('avatar_training', 'avatar_display_settings', 'avatar_webhooks');

-- Check RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('avatar_training', 'avatar_display_settings', 'avatar_webhooks');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Avatar database schema created successfully!';
    RAISE NOTICE 'Tables: avatar_training, avatar_display_settings, avatar_webhooks';
    RAISE NOTICE 'RLS: Enabled on all tables';
    RAISE NOTICE 'Triggers: updated_at triggers added';
END $$;
