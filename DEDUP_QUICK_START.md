# ⚡ Quick Deduplication Setup (2 Minutes)

## Step 1: Run SQL Migration (30 seconds)

Supabase Dashboard → SQL Editor → Paste & Run:

```sql
ALTER TABLE voice_samples ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE video_samples ADD COLUMN IF NOT EXISTS file_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_voice_samples_hash ON voice_samples(user_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_video_samples_hash ON video_samples(user_id, file_hash);
```

## Step 2: Update dashboard.html (1 minute)

**Option A: Load deduplication script (Easiest)**

Add before closing `</body>` tag in dashboard.html:

```html
<script src="js/dedup-integration.js"></script>
</body>
```

**Option B: Copy/paste code directly**

1. Open `dashboard.html`
2. Find the line: `document.getElementById('clone-form').addEventListener('submit', async (e) => {`
3. **Delete** the entire existing submit handler (from `document.getElementById('clone-form')...` to the closing `});`)
4. **Replace** with the code from `js/dedup-integration.js`

## Step 3: Test It (30 seconds)

1. Refresh dashboard (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)
2. Upload a file (e.g., `test.mp3`)
3. Upload **same file again**
4. **Expected**: "⏭️ Skipped duplicate: test.mp3" warning appears
5. **Console log** should show: `[Dedup] ⏭️ Skipping duplicate: test.mp3`

## What You'll See

**First Upload:**
```
[Dedup] Processing voice file: sample.mp3
[Dedup] File hash: a1b2c3d4e5f6...
[Dedup] ⬆️ Uploading new file: sample.mp3
Upload Progress: 100%
✅ Upload complete! 1 files uploaded successfully.
```

**Second Upload (Duplicate):**
```
[Dedup] Processing voice file: sample.mp3
[Dedup] File hash: a1b2c3d4e5f6... (SAME!)
[Dedup] ⏭️ Skipping duplicate: sample.mp3
⏭️ Skipped duplicate: sample.mp3
✅ Upload complete! 0 new files uploaded, 1 duplicates skipped.
```

## How It Works

1. **Calculate SHA-256 hash** of file content
2. **Query database** for existing hash
3. **Skip upload** if hash exists (duplicate)
4. **Upload only** if hash is new

**Smart Detection:**
- Detects duplicates even if filename changes
- `voice.mp3` → `voice-copy.mp3` → `my-recording.mp3` (all same content = 1 upload)

## Storage Savings Example

**Without deduplication:**
- Upload `file1.mp3` (20MB)
- Upload `file1.mp3` again (20MB)
- **Total storage: 40MB** ❌

**With deduplication:**
- Upload `file1.mp3` (20MB)
- Upload `file1.mp3` again → skipped
- **Total storage: 20MB** ✅ **50% savings**

## Troubleshooting

**"Column file_hash does not exist" error:**
→ Run Step 1 SQL migration

**Duplicates still uploading:**
→ Check browser console for `[Dedup]` logs
→ Hard refresh page (Ctrl+Shift+R)

**Hash calculation slow on large files:**
→ Normal - 100ms per 10MB
→ Shows "Checking for duplicates..." message during hash calc

## Files Reference

- `sql/add-file-hash.sql` - Database migration
- `js/dedup-integration.js` - Complete deduplication code
- `js/deduplication.js` - Helper functions only
- `DEDUPLICATION.md` - Detailed explanation

## Alternative: Replace Old Files

If you want uploading same file to **replace** instead of skip, change this line in `dedup-integration.js`:

```javascript
if (duplicate) {
    // ADD THIS CODE:
    await supabase.storage.from(bucket).remove([duplicate.file_path]);
    await supabase.from(tableName).delete().eq('file_path', duplicate.file_path);
    console.log('[Dedup] 🔄 Replacing old file');
    // THEN continue with upload (don't skip)
}
```

## Status

✅ **Ready to use** - Just run SQL migration and reload page with script

**Total setup time: 2 minutes**
