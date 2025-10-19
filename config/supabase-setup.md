# Supabase Setup Guide for NeuralMeet

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new organization (if needed)
4. Create new project:
   - Project name: `neuralmeet`
   - Database password: (generate strong password)
   - Region: Choose closest to your users

### 2. Get API Credentials

Once project is created:

1. Go to Project Settings → API
2. Copy:
   - `Project URL` (e.g., `https://xxxxx.supabase.co`)
   - `anon public` key (starts with `eyJ...`)

3. Update credentials in:
   - `auth.html` (lines 412-413)
   - `dashboard.html` (lines 619-620)

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Enable Authentication Providers

#### Email/Password (Default - Already Enabled)
- No additional setup needed

#### Google OAuth
1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Get Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

### 4. Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Users profile table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    full_name TEXT,
    company TEXT,
    role TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Clone settings
CREATE TABLE public.ai_clones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    voice_model_id TEXT,
    video_avatar_id TEXT,
    communication_style TEXT,
    decision_style TEXT,
    training_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Calendar integrations
CREATE TABLE public.calendar_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    provider TEXT NOT NULL, -- 'google', 'outlook', 'zoom'
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Meetings
CREATE TABLE public.meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_url TEXT,
    calendar_event_id TEXT,
    automation_status TEXT DEFAULT 'pending', -- 'pending', 'automated', 'manual', 'skipped'
    clone_attended BOOLEAN DEFAULT false,
    transcript TEXT,
    summary TEXT,
    action_items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Decision rules
CREATE TABLE public.decision_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    rule_name TEXT NOT NULL,
    condition JSONB NOT NULL,
    action TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own clone" ON public.ai_clones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own clone" ON public.ai_clones
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own integrations" ON public.calendar_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integrations" ON public.calendar_integrations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own meetings" ON public.meetings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meetings" ON public.meetings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rules" ON public.decision_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own rules" ON public.decision_rules
    FOR ALL USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Email Templates (Optional)

Customize email templates in Authentication → Email Templates:

1. **Confirm Signup**: Welcome email with verification
2. **Magic Link**: Passwordless login
3. **Change Email**: Email change confirmation
4. **Reset Password**: Password reset instructions

### 6. Security Settings

1. Go to Authentication → URL Configuration
2. Add your site URL: `https://bharathk2498.github.io/neuralmeet`
3. Add redirect URLs:
   - `https://bharathk2498.github.io/neuralmeet/dashboard.html`
   - `http://localhost:8000/dashboard.html` (for local dev)

### 7. Storage Buckets (for file uploads)

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('voice-samples', 'voice-samples', false),
    ('video-avatars', 'video-avatars', false);

-- Storage policies
CREATE POLICY "Users can upload own voice samples"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own video avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'video-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

## Testing

1. Open `auth.html` in browser
2. Create test account
3. Check Supabase Dashboard → Authentication → Users
4. Verify profile created in Table Editor → profiles

## Production Checklist

- [ ] Update SUPABASE_URL in both HTML files
- [ ] Update SUPABASE_ANON_KEY in both HTML files
- [ ] Run database schema SQL
- [ ] Enable Google OAuth (optional)
- [ ] Configure email templates
- [ ] Set up storage buckets
- [ ] Add redirect URLs
- [ ] Test signup/login flow
- [ ] Test password reset
- [ ] Verify RLS policies working

## Environment Variables (for backend)

Create `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Next Steps

1. Set up N8N workflows for calendar integration
2. Integrate HeyGen API for video clone
3. Integrate Emily AI / ElevenLabs for voice
4. Build meeting automation logic
5. Implement decision engine

## Support

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/bharathk2498/neuralmeet/issues
