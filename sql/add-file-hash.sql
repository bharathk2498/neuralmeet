-- Add file_hash column to voice_samples and video_samples tables
-- This enables deduplication by detecting identical files

-- Add hash column to voice_samples
ALTER TABLE voice_samples 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Add hash column to video_samples
ALTER TABLE video_samples 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Create index for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_voice_samples_hash 
ON voice_samples(user_id, file_hash);

CREATE INDEX IF NOT EXISTS idx_video_samples_hash 
ON video_samples(user_id, file_hash);

-- Optional: Add unique constraint to prevent duplicates at DB level
-- Uncomment these if you want strict enforcement:
-- ALTER TABLE voice_samples ADD CONSTRAINT unique_voice_hash UNIQUE (user_id, file_hash);
-- ALTER TABLE video_samples ADD CONSTRAINT unique_video_hash UNIQUE (user_id, file_hash);

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('voice_samples', 'video_samples') 
AND column_name = 'file_hash';
