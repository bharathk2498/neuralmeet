# Avatar Storage & Selection - Complete System

## How It Works

### 1. Storage Location

**Database: `avatar_training` table**
```
avatar_training
├── id (UUID)
├── user_id (who owns it)
├── status (pending/training/completed/failed)
├── avatar_video_url (the actual video)
├── avatar_thumbnail_url (preview image)
└── created_at (when created)
```

**User can have MULTIPLE avatars:**
- Professional avatar (suit & tie)
- Casual avatar (t-shirt)
- Formal avatar (business attire)
- Different hairstyles/looks

### 2. Active Avatar Selection

**Database: `avatar_display_settings` table**
```
avatar_display_settings
├── user_id (one row per user)
└── avatar_training_id → Points to active avatar
```

**Only ONE avatar is "active" at a time** = the one used in meetings

### 3. UI Flow

```
┌──────────────────────────────────────────────┐
│ SIDEBAR                                      │
├──────────────────────────────────────────────┤
│ 📊 Overview                                  │
│ 📅 Calendar Setup                            │
│ 🎭 AI Clone (upload page)                   │
│ 🎭 My Avatars  ← NEW PAGE                   │
│ 💼 Meetings                                  │
└──────────────────────────────────────────────┘
```

## Avatar Gallery Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  My AI Avatars                         [+ Create New Avatar] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🌟 Active Avatar                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  ┌──────────┐    Your current active avatar             │ │
│  │  │  [VIDEO] │    Status: ✅ Ready                        │ │
│  │  │  [PLAY]  │    This avatar will attend meetings       │ │
│  │  └──────────┘                                            │ │
│  │                 [🎤 Test Avatar]                         │ │
│  │                                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  All Your Avatars (3)                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                           ││
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐          ││
│  │  │ [VIDEO]  │    │ [VIDEO]  │    │   🎬     │          ││
│  │  │ [THUMB]  │    │ [THUMB]  │    │ Training │          ││
│  │  │ ✓ ACTIVE │    │          │    │   67%    │          ││
│  │  │          │    │          │    │          │          ││
│  │  │ Oct 19   │    │ Oct 15   │    │ Oct 20   │          ││
│  │  │          │    │          │    │          │          ││
│  │  │[✓ Active]│    │[Set Act] │    │[░░░░░░░] │          ││
│  │  │ [Test]   │    │ [Test]   │    │[Cancel]  │          ││
│  │  │ [🗑️]    │    │ [🗑️]    │    │ [🗑️]    │          ││
│  │  └──────────┘    └──────────┘    └──────────┘          ││
│  │                                                           ││
│  │  Professional    Casual Look   Training...               ││
│  │  Business Look                                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## User Actions

### Creating Multiple Avatars

**Scenario: User wants 3 different looks**

1. **First Avatar (Business)**
   ```
   Go to "AI Clone" page
   → Upload: business-voice.mp3, business-video.mp4
   → Click "Train AI Clone"
   → Avatar created
   ```

2. **Second Avatar (Casual)**
   ```
   Go to "AI Clone" page again
   → Upload: casual-voice.mp3, casual-video.mp4
   → Click "Train AI Clone"
   → Another avatar created
   ```

3. **Third Avatar (Formal)**
   ```
   Repeat process
   → Now have 3 avatars total
   ```

### Selecting Active Avatar

**Go to "My Avatars" page:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Business │    │  Casual  │    │  Formal  │
│ [VIDEO]  │    │ [VIDEO]  │    │ [VIDEO]  │
│ ✓ ACTIVE │    │          │    │          │
│[✓ Active]│    │[Set Act] │    │[Set Act] │
└──────────┘    └──────────┘    └──────────┘
     ↑               ↓               ↓
  Currently    Click here      Click here
   active      to switch       to switch
```

**Click "Set Active" button** → That avatar becomes the meeting avatar

### What Happens When Switching

```
Before:
avatar_display_settings
├── user_id: bharath
└── avatar_training_id: business-avatar-id

User clicks "Set Active" on Casual avatar

After:
avatar_display_settings
├── user_id: bharath
└── avatar_training_id: casual-avatar-id ← Changed!

Now: Casual avatar will attend meetings
```

## Visual Indicators

### Active Avatar
```
┌──────────┐
│ [VIDEO]  │
│  ACTIVE  │ ← Green badge
│ ✓ Active │ ← Green button (disabled)
│  [Test]  │
└──────────┘
```

### Inactive Avatar
```
┌──────────┐
│ [VIDEO]  │
│          │
│[Set Act] │ ← Primary button (clickable)
│  [Test]  │
└──────────┘
```

### Training Avatar
```
┌──────────┐
│   🎬     │
│ Training │
│   67%    │
│[░░░░░░░] │ ← Progress bar
└──────────┘
```

## Database Queries

### Get All User's Avatars
```sql
SELECT * FROM avatar_training
WHERE user_id = 'bharath-user-id'
ORDER BY created_at DESC;
```

### Get Active Avatar
```sql
SELECT at.* 
FROM avatar_training at
JOIN avatar_display_settings ads 
  ON at.id = ads.avatar_training_id
WHERE ads.user_id = 'bharath-user-id';
```

### Set New Active Avatar
```sql
INSERT INTO avatar_display_settings (
    user_id, 
    avatar_training_id
) VALUES (
    'bharath-user-id',
    'new-avatar-id'
) 
ON CONFLICT (user_id) 
DO UPDATE SET 
    avatar_training_id = 'new-avatar-id',
    updated_at = NOW();
```

## Real-World Example

**User: Bharath**

Creates 3 avatars over time:

1. **Oct 15** - Business Look
   - Dark suit, professional lighting
   - Used for client meetings

2. **Oct 18** - Casual Look  
   - T-shirt, relaxed setting
   - Used for team standups

3. **Oct 20** - Formal Look
   - Formal attire, studio lighting
   - Used for board meetings

**Active Selection:**
- Morning: Activates "Casual" for team standup
- Afternoon: Switches to "Business" for client call
- Evening: Switches to "Formal" for board meeting

**All done from "My Avatars" page with one click!**

## Storage Costs

### Per Avatar
```
avatar_training table
- Database row: ~1KB
- Video file: ~5-50MB
- Thumbnail: ~100KB

Total per avatar: ~5-50MB
Monthly storage cost: $0.02 - $0.10
```

### Multiple Avatars
```
3 avatars = 15-150MB = $0.06 - $0.30/month
10 avatars = 50-500MB = $0.20 - $1.00/month

Cost is negligible!
```

## UI States

### Empty (New User)
```
🎭
No avatars yet
Upload voice and video to create your first AI avatar
[Create Avatar]
```

### One Avatar
```
Active Avatar: [VIDEO]
Status: Ready

All Avatars (1):
[VIDEO] ✓ Active
```

### Multiple Avatars
```
Active Avatar: [VIDEO #2]
Status: Ready

All Avatars (3):
[VIDEO #1] [Set Active]
[VIDEO #2] ✓ Active
[VIDEO #3] [Set Active]
```

### With Training Avatar
```
All Avatars (3):
[VIDEO] ✓ Active
[VIDEO] [Set Active]
[🎬 67%] Training...
```

## Key Points

1. **Multiple Avatars Allowed** ✅
   - User can have unlimited avatars
   - Each stored separately in database

2. **One Active Avatar** ✅
   - Only one marked as "active"
   - This is the meeting avatar

3. **Easy Switching** ✅
   - Click "Set Active" button
   - Instant switch
   - No re-upload needed

4. **Persistent Storage** ✅
   - Videos stored in Supabase Storage
   - URLs in database
   - Never lost

5. **Real-Time Updates** ✅
   - Training progress shows live
   - New avatars appear automatically
   - Active state syncs across devices

## Next: Add to Dashboard

Follow `AVATAR_UI_INTEGRATION.md` to add this UI to your dashboard!

**Time to implement: 5 minutes** (copy-paste HTML/CSS/JS)
