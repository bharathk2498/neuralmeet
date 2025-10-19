# Avatar Gallery Integration Guide

## What This Adds:

**New "My Avatars" page where users can:**
- ✅ See all their avatars in a grid
- ✅ View which avatar is currently active
- ✅ Set/change active avatar with one click
- ✅ Preview avatars in fullscreen modal
- ✅ Test avatars with custom speech
- ✅ Delete old avatars
- ✅ See training progress in real-time

## 5-Minute Integration

### Step 1: Add Menu Item

In `dashboard.html`, find the sidebar menu (around line 65) and add:

```html
<!-- ADD THIS after the "AI Clone" menu item -->
<li class="menu-item" onclick="showPage('avatars')">
    <span class="menu-icon">🎭</span>
    <span>My Avatars</span>
</li>
```

### Step 2: Add Avatar Page

Find `<div id="clone-page"` (around line 180) and add this AFTER it:

```html
<!-- ADD ENTIRE AVATARS PAGE -->
<div id="avatars-page" class="page-content" style="display: none;">
    <div id="avatar-alert"></div>
    
    <div class="section">
        <div class="section-header">
            <h2 class="section-title">My AI Avatars</h2>
            <button class="btn btn-primary" onclick="showPage('clone')">
                + Create New Avatar
            </button>
        </div>
        
        <!-- Active Avatar Preview -->
        <div id="active-avatar-preview" class="active-avatar-section">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        </div>
        
        <!-- Avatar Gallery -->
        <div id="avatar-gallery" class="avatar-gallery-container">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading avatars...</p>
            </div>
        </div>
    </div>
</div>
```

### Step 3: Add Modal

Before `</body>` tag (end of file), add:

```html
<!-- ADD AVATAR PREVIEW MODAL -->
<div id="avatar-modal" class="modal" style="display: none;" onclick="if(event.target === this) closeAvatarModal()">
    <div class="modal-content avatar-modal-content">
        <div class="modal-header">
            <h3 id="modal-avatar-title">Avatar Preview</h3>
            <button class="modal-close" onclick="closeAvatarModal()">×</button>
        </div>
        <div class="modal-body">
            <video 
                id="modal-avatar-video" 
                controls 
                autoplay
                style="width: 100%; max-width: 800px; border-radius: 12px;"
            >
            </video>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeAvatarModal()">Close</button>
        </div>
    </div>
</div>
```

### Step 4: Add Script

Right before `</body>`, add:

```html
<script src="js/avatar-management.js"></script>
</body>
```

### Step 5: Add CSS

Copy ALL styles from `html/avatar-gallery-ui.html` and paste into the `<style>` section of `dashboard.html`.

Or add this line in `<head>`:
```html
<link rel="stylesheet" href="css/avatar-gallery.css">
```

Then create `css/avatar-gallery.css` with the styles.

## What Users See

### Empty State (No Avatars Yet)
```
┌─────────────────────────────────┐
│  My AI Avatars     [+ Create]   │
├─────────────────────────────────┤
│                                 │
│          🎭                     │
│    No avatars yet               │
│                                 │
│  Upload voice and video to      │
│  create your first AI avatar    │
│                                 │
│      [Create Avatar]            │
│                                 │
└─────────────────────────────────┘
```

### With Avatars
```
┌─────────────────────────────────────────────────┐
│  My AI Avatars               [+ Create New]     │
├─────────────────────────────────────────────────┤
│  Active Avatar                                  │
│  ┌──────────┬────────────────────────────────┐ │
│  │ [VIDEO]  │  Ready to attend meetings      │ │
│  │ [PLAY]   │  [Test Avatar]                 │ │
│  └──────────┴────────────────────────────────┘ │
│                                                 │
│  All Avatars                                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ [VIDEO] │  │ [VIDEO] │  │   🎬    │        │
│  │ ACTIVE  │  │         │  │Training │        │
│  │ Oct 19  │  │ Oct 15  │  │  45%    │        │
│  │[✓Active]│  │[Set Act]│  │[░░░░░░░]│        │
│  │ [Test]  │  │ [Test]  │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────┘
```

### Click Video → Fullscreen Modal
```
┌─────────────────────────────────────────┐
│  Avatar Preview                    [×]  │
├─────────────────────────────────────────┤
│                                         │
│          [FULLSCREEN VIDEO]             │
│          [  PLAYING...     ]            │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│                        [Close]          │
└─────────────────────────────────────────┘
```

## User Actions

### Set Active Avatar
```
1. User clicks "Set Active" button
2. System saves to avatar_display_settings
3. Card shows "✓ Active" badge
4. Avatar appears in top bar
5. Ready for meetings!
```

### Test Avatar
```
1. User clicks "Test"
2. Modal: "What should your avatar say?"
3. User enters: "Hello team!"
4. System generates 30s video
5. Shows avatar saying exact text
```

### Create New Avatar
```
1. Click "+ Create New"
2. Goes to clone page
3. Upload voice + video
4. New avatar appears in gallery
5. Can set as active
```

## Database Flow

### Active Avatar Selection
```sql
-- When user clicks "Set Active"
INSERT INTO avatar_display_settings (
    user_id, 
    avatar_training_id,
    show_avatar
) VALUES (
    'user-id',
    'avatar-id',
    true
) ON CONFLICT (user_id) 
DO UPDATE SET avatar_training_id = 'avatar-id';

-- Load active avatar
SELECT * FROM avatar_training 
WHERE id = (
    SELECT avatar_training_id 
    FROM avatar_display_settings 
    WHERE user_id = 'user-id'
);
```

## Real-Time Updates

Avatars automatically update using Supabase Realtime:

```javascript
// When avatar training completes
Database: avatar_training.status = 'completed'
         ↓
Realtime webhook fires
         ↓
JavaScript receives update
         ↓
Gallery refreshes automatically
         ↓
User sees: "✅ Avatar Ready!"
```

## Testing Checklist

After integration:

- [ ] "My Avatars" menu item appears
- [ ] Click it → shows avatars page
- [ ] Run demo SQL (previous steps)
- [ ] Avatar card appears in gallery
- [ ] Click "Set Active" → badge shows
- [ ] Click video → modal opens
- [ ] Video plays in fullscreen
- [ ] Click "Test" → prompt appears
- [ ] Top-right avatar updates with thumbnail

## Troubleshooting

**Nothing shows?**
→ Check browser console for errors
→ Verify `js/avatar-management.js` loaded
→ Run SQL to insert demo avatar

**"Set Active" doesn't work?**
→ Check `avatar_display_settings` table exists
→ Run `sql/avatar-schema.sql`

**Video won't play?**
→ Check video URL is valid
→ Test URL directly in browser
→ Check CORS settings on storage

**Gallery is empty?**
→ Run demo SQL insert command
→ Check `avatar_training` table for records
→ Verify `user_id` matches logged-in user

## Files You Need

```
dashboard.html          ← Update this (4 places)
js/avatar-management.js ← Already in GitHub ✅
html/avatar-gallery-ui.html ← Copy CSS from here ✅
sql/avatar-schema.sql   ← Already ran this ✅
```

## Quick Copy-Paste

All the code you need is in `html/avatar-gallery-ui.html`:

1. Copy HTML sections → Paste into `dashboard.html`
2. Copy CSS → Paste into `<style>` section
3. Add `<script src="js/avatar-management.js"></script>`
4. Done!

Total time: **5 minutes**

## Next Steps

1. ✅ Integrate UI (above)
2. Test with demo avatar
3. Get HeyGen/D-ID API keys
4. Connect real avatar generation
5. Users can create unlimited avatars!

**The UI is ready - just needs copy-paste into dashboard.html!**
