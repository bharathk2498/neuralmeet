-- Storage Security Migration
-- Run this in Supabase SQL Editor to enable Row Level Security
-- Prevents unauthorized access to user files

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Users read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;

-- ============================================
-- 3. READ POLICY - Users can only read their own files
-- ============================================

CREATE POLICY "Users read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('voice-samples', 'video-samples') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 4. INSERT POLICY - Users can only upload to their own folders
-- ============================================

CREATE POLICY "Users upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('voice-samples', 'video-samples')
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND pg_catalog.length(name) < 500  -- Prevent path traversal
);

-- ============================================
-- 5. UPDATE POLICY - Users can update their own files
-- ============================================

CREATE POLICY "Users update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('voice-samples', 'video-samples')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN ('voice-samples', 'video-samples')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 6. DELETE POLICY - Users can delete their own files
-- ============================================

CREATE POLICY "Users delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('voice-samples', 'video-samples')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 7. VERIFY POLICIES
-- ============================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index on bucket_id for faster policy checks
CREATE INDEX IF NOT EXISTS idx_objects_bucket_id 
ON storage.objects(bucket_id);

-- Index on name pattern for folder extraction
CREATE INDEX IF NOT EXISTS idx_objects_name_pattern 
ON storage.objects(name text_pattern_ops);

-- ============================================
-- 9. STORAGE BUCKETS CONFIGURATION
-- ============================================

-- Ensure buckets exist with correct settings
-- Run these INSERT statements if buckets don't exist

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('voice-samples', 'voice-samples', false, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'video/quicktime'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('video-samples', 'video-samples', false, 104857600, ARRAY['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];

-- ============================================
-- 10. AUDIT TABLE (Optional but recommended)
-- ============================================

CREATE TABLE IF NOT EXISTS public.storage_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  bucket_id TEXT NOT NULL,
  object_path TEXT NOT NULL,
  file_size BIGINT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE public.storage_audit ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit logs
CREATE POLICY "Users read own audit logs"
ON public.storage_audit
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 11. TRIGGER FOR AUDIT LOGGING (Optional)
-- ============================================

CREATE OR REPLACE FUNCTION public.log_storage_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.storage_audit (
    user_id,
    action,
    bucket_id,
    object_path,
    file_size
  ) VALUES (
    auth.uid(),
    TG_OP,
    NEW.bucket_id,
    NEW.name,
    NEW.metadata->>'size'::BIGINT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to storage.objects
DROP TRIGGER IF EXISTS storage_audit_trigger ON storage.objects;
CREATE TRIGGER storage_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION public.log_storage_access();

-- ============================================
-- 12. VERIFY SETUP
-- ============================================

-- Check policies are active
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Should return 4 (read, insert, update, delete)

-- Check buckets configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('voice-samples', 'video-samples');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Storage security migration completed successfully!';
  RAISE NOTICE 'RLS enabled: ✓';
  RAISE NOTICE 'Policies created: ✓';
  RAISE NOTICE 'Audit logging: ✓';
END $$;
