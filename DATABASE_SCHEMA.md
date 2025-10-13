# NEURALMEET - DATABASE SCHEMA

Last Updated: October 13, 2025

## OVERVIEW

This document defines the complete database structure for NeuralMeet. All tables, relationships, and policies are documented here.

Use Supabase SQL Editor to execute these statements in order.

---

## INSTALLATION INSTRUCTIONS

1. Open Supabase Dashboard
2. Click SQL Editor in left sidebar
3. Click New Query
4. Copy and paste each section below, one at a time
5. Click Run after each section
6. Verify success before moving to next section

---

## USERS TABLE

This extends Supabase Auth users table with additional profile information.

```sql
-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    job_title TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'solopreneur', 'executive', 'enterprise')),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    meetings_this_month INTEGER DEFAULT 0,
    total_meetings_processed INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## MEETINGS TABLE

Stores information about each meeting uploaded or processed.

```sql
-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    participants TEXT[],
    meeting_platform TEXT, -- zoom, google_meet, teams, other
    fireflies_meeting_id TEXT UNIQUE,
    transcript_url TEXT,
    recording_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_created_at ON public.meetings(created_at DESC);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Policies for meetings
CREATE POLICY "Users can view own meetings"
    ON public.meetings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
    ON public.meetings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
    ON public.meetings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
    ON public.meetings FOR DELETE
    USING (auth.uid() = user_id);
```

---

## BRIEFS TABLE

Stores the generated meeting briefs and summaries.

```sql
-- Create briefs table
CREATE TABLE IF NOT EXISTS public.briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Brief sections
    executive_summary TEXT,
    key_topics TEXT[],
    discussion_points TEXT[],
    action_items TEXT[],
    decisions_made TEXT[],
    questions_raised TEXT[],
    follow_up_needed TEXT[],
    historical_context TEXT,
    recommended_prep TEXT,
    
    -- Metadata
    sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
    importance_score NUMERIC(3,2), -- 0.00 to 1.00
    keywords TEXT[],
    
    -- Generation info
    tokens_used INTEGER,
    processing_time_seconds INTEGER,
    model_used TEXT DEFAULT 'gpt-4',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_briefs_meeting_id ON public.briefs(meeting_id);
CREATE INDEX idx_briefs_user_id ON public.briefs(user_id);
CREATE INDEX idx_briefs_created_at ON public.briefs(created_at DESC);

-- Enable RLS
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Policies for briefs
CREATE POLICY "Users can view own briefs"
    ON public.briefs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs"
    ON public.briefs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs"
    ON public.briefs FOR UPDATE
    USING (auth.uid() = user_id);
```

---

## TRANSCRIPTS TABLE

Stores the full meeting transcripts from Fireflies.

```sql
-- Create transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Transcript content
    full_transcript TEXT NOT NULL,
    transcript_json JSONB, -- Structured transcript with timestamps and speakers
    
    -- Metadata
    word_count INTEGER,
    speaker_count INTEGER,
    speakers TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transcripts_meeting_id ON public.transcripts(meeting_id);
CREATE INDEX idx_transcripts_user_id ON public.transcripts(user_id);

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Policies for transcripts
CREATE POLICY "Users can view own transcripts"
    ON public.transcripts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts"
    ON public.transcripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

---

## FEEDBACK TABLE

Stores user feedback on brief quality and features.

```sql
-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    brief_id UUID REFERENCES public.briefs(id) ON DELETE SET NULL,
    
    -- Feedback content
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature_request', 'quality', 'general')),
    
    -- Status tracking
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'completed', 'wont_fix')),
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
CREATE POLICY "Users can view own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
    ON public.feedback FOR UPDATE
    USING (auth.uid() = user_id);
```

---

## USAGE TRACKING TABLE

Tracks API usage and costs for monitoring.

```sql
-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Usage metrics
    action_type TEXT NOT NULL, -- brief_generation, transcript_fetch, etc
    tokens_used INTEGER,
    api_calls INTEGER DEFAULT 1,
    processing_time_seconds INTEGER,
    cost_usd NUMERIC(10,4),
    
    -- Context
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    service_used TEXT, -- openai, fireflies, etc
    model_used TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_created_at ON public.usage_tracking(created_at DESC);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for usage tracking
CREATE POLICY "Users can view own usage"
    ON public.usage_tracking FOR SELECT
    USING (auth.uid() = user_id);
```

---

## SUBSCRIPTION EVENTS TABLE

Tracks subscription changes for analytics and debugging.

```sql
-- Create subscription events table
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL, -- subscription_created, subscription_updated, subscription_cancelled, payment_failed
    old_tier TEXT,
    new_tier TEXT,
    old_status TEXT,
    new_status TEXT,
    
    -- Stripe data
    stripe_event_id TEXT UNIQUE,
    stripe_event_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX idx_subscription_events_created_at ON public.subscription_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Policies for subscription events
CREATE POLICY "Users can view own subscription events"
    ON public.subscription_events FOR SELECT
    USING (auth.uid() = user_id);
```

---

## STORAGE BUCKETS

Set up file storage for meeting recordings and transcripts.

```sql
-- Create storage bucket for meeting files
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-files', 'meeting-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow users to upload to their own folder
CREATE POLICY "Users can upload own meeting files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'meeting-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to read their own files
CREATE POLICY "Users can view own meeting files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'meeting-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to update their own files
CREATE POLICY "Users can update own meeting files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'meeting-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete own meeting files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'meeting-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## HELPER FUNCTIONS

Useful database functions for common operations.

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON public.briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment user meeting counter
CREATE OR REPLACE FUNCTION increment_meeting_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET meetings_this_month = meetings_this_month + 1,
        total_meetings_processed = total_meetings_processed + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment counter when meeting completed
CREATE TRIGGER on_meeting_completed
    AFTER UPDATE OF status ON public.meetings
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION increment_meeting_counter();

-- Function to reset monthly meeting counter (run monthly via cron)
CREATE OR REPLACE FUNCTION reset_monthly_meeting_counters()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles SET meetings_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## VIEWS FOR REPORTING

Useful views for analytics and dashboards.

```sql
-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    p.id,
    p.email,
    p.full_name,
    p.subscription_tier,
    p.subscription_status,
    p.meetings_this_month,
    p.total_meetings_processed,
    COUNT(DISTINCT m.id) as total_meetings,
    COUNT(DISTINCT b.id) as total_briefs,
    AVG(f.rating) as average_rating,
    SUM(u.tokens_used) as total_tokens_used,
    SUM(u.cost_usd) as total_cost_usd
FROM public.profiles p
LEFT JOIN public.meetings m ON p.id = m.user_id
LEFT JOIN public.briefs b ON p.id = b.user_id
LEFT JOIN public.feedback f ON p.id = f.user_id
LEFT JOIN public.usage_tracking u ON p.id = u.user_id
GROUP BY p.id, p.email, p.full_name, p.subscription_tier, p.subscription_status, p.meetings_this_month, p.total_meetings_processed;

-- View for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT
    m.id as meeting_id,
    m.user_id,
    p.email,
    m.title as meeting_title,
    m.status,
    m.created_at,
    m.processed_at,
    b.id as brief_id,
    CASE
        WHEN m.processed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (m.processed_at - m.created_at))
        ELSE NULL
    END as processing_time_seconds
FROM public.meetings m
JOIN public.profiles p ON m.user_id = p.id
LEFT JOIN public.briefs b ON m.id = b.meeting_id
ORDER BY m.created_at DESC
LIMIT 100;
```

---

## DATA RETENTION POLICIES

Set up automatic cleanup of old data.

```sql
-- Function to delete old transcripts (keep only 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_transcripts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.transcripts
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize cancelled user data after 30 days
CREATE OR REPLACE FUNCTION anonymize_cancelled_users()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET
        email = 'deleted_' || id || '@deleted.com',
        full_name = 'Deleted User',
        phone_number = NULL,
        company_name = NULL,
        job_title = NULL
    WHERE subscription_status = 'cancelled'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## TESTING QUERIES

Use these to verify your database is set up correctly.

```sql
-- Test 1: Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected result: briefs, feedback, meetings, profiles, subscription_events, transcripts, usage_tracking

-- Test 2: Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Expected result: All tables should show rowsecurity = true

-- Test 3: Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected result: Multiple policies per table

-- Test 4: Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'meeting-files';

-- Expected result: One row with bucket details

-- Test 5: Test trigger functions
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
SELECT * FROM public.profiles WHERE email = 'test@example.com';

-- Expected result: Profile should be auto-created
-- Clean up: DELETE FROM auth.users WHERE email = 'test@example.com';
```

---

## BACKUP AND MAINTENANCE

Supabase provides automatic backups, but here are manual backup commands for reference.

```sql
-- Export all data (run from command line, not SQL editor)
-- pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

-- Restore from backup
-- psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres')) as database_size;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## COMMON ISSUES AND FIXES

Issue: RLS policy blocking inserts
Solution: Make sure user is authenticated and check WITH CHECK clause

Issue: Foreign key constraint violation
Solution: Ensure referenced records exist before inserting

Issue: Storage bucket policy not working
Solution: Verify folder structure matches policy (user_id as first folder level)

Issue: Trigger not firing
Solution: Check trigger is enabled: SELECT * FROM pg_trigger WHERE tgname = 'trigger_name'

---

This completes the database schema. All tables, policies, functions, and views are now documented and ready for implementation.
