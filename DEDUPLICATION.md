# File Deduplication Guide

## Current Behavior ❌

**Uploading the same file twice creates DUPLICATES:**

```
First upload:  fb891a65-c32a-4273-b929-863de52fac66/voice/1729363200000-sample.mp3
Second upload: fb891a65-c32a-4273-b929-863de52fac66/voice/1729363205000-sample.mp3
```

Both files:
- Take up storage space (2x cost)
- Create duplicate database entries
- Waste training compute time
- No warning shown to user

## Why This Happens

Your upload code generates unique paths using timestamps:
```javascript
const filePath = currentUser.id + '/voice/' + Date.now() + '-' + file.name;
```

Even if `sample.mp3` is uploaded twice, `Date.now()` creates different timestamps, so Supabase sees them as different files.

## Solution: Hash-Based Deduplication

### How It Works

1. **Calculate file hash** (SHA-256) before upload
2. **Check database** for existing files with same hash
3. **Skip upload** if duplicate found, or
4. **Upload only** if file is new

### Implementation Steps

#### Step 1: Run SQL Migration

Go to **Supabase Dashboard > SQL Editor** and run:

```sql
-- File: sql/add-file-hash.sql

ALTER TABLE voice_samples 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

ALTER TABLE video_samples 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_voice_samples_hash 
ON voice_samples(user_id, file_hash);

CREATE INDEX IF NOT EXISTS idx_video_samples_hash 
ON video_samples(user_id, file_hash);
```

#### Step 2: Update dashboard.html

Add deduplication script:
```html
<!-- Add before closing </body> -->
<script src="js/deduplication.js"></script>
```

#### Step 3: Modify Upload Logic

Replace the upload loop in `dashboard.html`:

```javascript
// OLD CODE (creates duplicates):
for (const file of voiceFiles) {
    const filePath = currentUser.id + '/voice/' + Date.now() + '-' + file.name;
    await uploadToSupabase(file, 'voice-samples', filePath);
    
    await supabase.from('voice_samples').insert({
        user_id: currentUser.id,
        clone_id: cloneData.id,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size
    });
}

// NEW CODE (prevents duplicates):
for (const file of voiceFiles) {
    // Calculate file hash
    const fileHash = await getFileHash(file);
    
    // Check if file already exists
    const duplicate = await checkDuplicateFile(
        currentUser.id, 
        file.name, 
        fileHash, 
        'voice-samples'
    );
    
    if (duplicate) {
        console.log(`Skipping duplicate: ${file.name}`);
        showAlert('clone-alert', 
            `Skipped duplicate file: ${file.name}`, 
            'warning'
        );
        uploadedFiles++;
        updateProgress((uploadedFiles / totalFiles) * 100);
        continue; // Skip upload
    }
    
    // Upload only if not duplicate
    const filePath = currentUser.id + '/voice/' + Date.now() + '-' + file.name;
    await uploadToSupabase(file, 'voice-samples', filePath);
    
    await supabase.from('voice_samples').insert({
        user_id: currentUser.id,
        clone_id: cloneData.id,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_hash: fileHash  // Store hash
    });
    
    uploadedFiles++;
    updateProgress((uploadedFiles / totalFiles) * 100);
}
```

Do the same for `videoFiles` loop.

### Alternative: Replace Mode

If you want uploading the same file to **replace** the old one:

```javascript
if (duplicate) {
    // Delete old file from storage
    await supabase.storage
        .from('voice-samples')
        .remove([duplicate.file_path]);
    
    // Delete old database entry
    await supabase
        .from('voice_samples')
        .delete()
        .eq('file_path', duplicate.file_path);
    
    console.log(`Replaced: ${file.name}`);
}

// Continue with upload (will create new file)
```

## Testing Deduplication

1. Upload `test-voice.mp3`
2. Upload `test-voice.mp3` again
3. **Expected behavior:**
   - ⚠️ Warning: "Skipped duplicate file: test-voice.mp3"
   - Progress bar still updates
   - No duplicate in storage
   - No duplicate in database

## Storage Savings

**Before deduplication:**
- User uploads 5 files (50MB total)
- User re-uploads same 5 files
- **Storage used: 100MB** ❌

**After deduplication:**
- User uploads 5 files (50MB total)
- User re-uploads same 5 files → skipped
- **Storage used: 50MB** ✅

**Savings: 50% reduction in storage costs**

## Advanced: Content-Based Detection

The hash detects **identical files** even if renamed:

```
sample.mp3       → hash: abc123...
sample-copy.mp3  → hash: abc123... (SAME!)
my-voice.mp3     → hash: abc123... (SAME!)
```

All three files have the same content, so only one is stored.

## Manual Cleanup (Optional)

To remove existing duplicates:

```sql
-- Find duplicate hashes
WITH duplicates AS (
  SELECT file_hash, COUNT(*) as count
  FROM voice_samples
  WHERE file_hash IS NOT NULL
  GROUP BY file_hash
  HAVING COUNT(*) > 1
)
SELECT v.* 
FROM voice_samples v
INNER JOIN duplicates d ON v.file_hash = d.file_hash
ORDER BY v.file_hash, v.created_at;

-- Keep oldest, delete newer duplicates manually
```

## Performance Impact

- **Hash calculation**: ~100ms per 10MB file
- **Duplicate check**: <50ms (indexed query)
- **Total overhead**: ~150ms per file
- **Worth it**: Saves gigabytes of storage

## Status

- ✅ `js/deduplication.js` - Hash calculation functions
- ✅ `sql/add-file-hash.sql` - Database schema update
- ⏳ `dashboard.html` - Update upload logic (manual)

**Next: Run SQL migration, then update dashboard upload loops**
