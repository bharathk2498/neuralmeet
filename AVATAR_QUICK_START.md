# 🎬 Avatar Quick Start - Show Avatar to User

## TL;DR - 3 Options

| Option | Time | Cost | Realism | Complexity |
|--------|------|------|---------|------------|
| **Demo Mode** | 5 min | Free | ⭐⭐⭐ | Easy |
| **D-ID** | 1 hour | $6/mo | ⭐⭐⭐⭐ | Medium |
| **HeyGen** | 2 hours | $24/mo | ⭐⭐⭐⭐⭐ | Medium |

## Option 1: Demo Mode (Start Here - 5 Minutes)

Show users what their avatar will look like using a demo video.

### Step 1: Run SQL
```bash
# Supabase SQL Editor
psql < sql/avatar-schema.sql
```

### Step 2: Add Avatar Display to Dashboard

Add to `dashboard.html` after the clone training form:

```html
<!-- Avatar Preview Section -->
<div id="avatar-section" class="section" style="display: none;">
    <div class="section-header">
        <h2 class="section-title">🎭 Your AI Avatar</h2>
    </div>
    
    <div class="avatar-display">
        <div class="avatar-status" id="avatar-status">
            <!-- Status will be inserted here -->
        </div>
        
        <div class="avatar-preview-container" id="avatar-preview">
            <!-- Avatar video will be inserted here -->
        </div>
        
        <div class="avatar-actions">
            <button class="btn btn-primary" onclick="testAvatarSpeak()">
                🎤 Test Avatar Speech
            </button>
            <button class="btn btn-secondary" onclick="shareAvatar()">
                📤 Share Avatar
            </button>
        </div>
    </div>
</div>
```

### Step 3: Add JavaScript

```javascript
// Add after existing JavaScript in dashboard.html

async function checkAvatarStatus() {
    if (!currentUser) return;
    
    try {
        // Check if user has a completed avatar
        const { data: avatar, error } = await supabase
            .from('avatar_training')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (avatar) {
            showAvatar(avatar);
        } else {
            checkTrainingProgress();
        }
    } catch (err) {
        console.log('No avatar yet:', err);
    }
}

function showAvatar(avatarData) {
    const section = document.getElementById('avatar-section');
    const preview = document.getElementById('avatar-preview');
    const status = document.getElementById('avatar-status');
    
    section.style.display = 'block';
    
    // Show status
    status.innerHTML = `
        <div class="alert success">
            ✅ Your AI avatar is ready! It can now attend meetings on your behalf.
        </div>
    `;
    
    // Show avatar video
    preview.innerHTML = `
        <div class="avatar-card">
            <div class="avatar-video-wrapper">
                <video 
                    id="avatar-video"
                    controls 
                    poster="${avatarData.avatar_thumbnail_url || '/assets/avatar-placeholder.jpg'}"
                    style="width: 100%; max-width: 600px; border-radius: 12px;"
                >
                    <source src="${avatarData.avatar_video_url}" type="video/mp4">
                    Your browser doesn't support video.
                </video>
            </div>
            <div class="avatar-info">
                <p><strong>Status:</strong> <span class="badge success">Active</span></p>
                <p><strong>Created:</strong> ${new Date(avatarData.created_at).toLocaleDateString()}</p>
                <p><strong>Training Time:</strong> ${calculateTrainingTime(avatarData)}</p>
            </div>
        </div>
    `;
}

async function checkTrainingProgress() {
    const { data: training } = await supabase
        .from('avatar_training')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!training) return;

    const section = document.getElementById('avatar-section');
    const status = document.getElementById('avatar-status');
    
    section.style.display = 'block';
    
    if (training.status === 'training' || training.status === 'processing') {
        status.innerHTML = `
            <div class="alert warning">
                🎬 Creating your AI avatar... ${training.progress}%
                <div class="progress-bar" style="margin-top: 0.5rem;">
                    <div class="progress-fill" style="width: ${training.progress}%"></div>
                </div>
                <p style="margin-top: 0.5rem; font-size: 0.85rem;">
                    This usually takes 5-10 minutes. We'll notify you when it's ready.
                </p>
            </div>
        `;
        
        // Poll for updates
        setTimeout(checkTrainingProgress, 5000);
    } else if (training.status === 'failed') {
        status.innerHTML = `
            <div class="alert error">
                ❌ Avatar training failed: ${training.error_message || 'Unknown error'}
                <button class="btn btn-primary" onclick="retryAvatarTraining()">
                    Retry
                </button>
            </div>
        `;
    }
}

function testAvatarSpeak() {
    const text = prompt("What should your avatar say?", "Hello! I'm your AI assistant.");
    if (!text) return;
    
    showAlert('avatar-status', '🎬 Generating video... This takes 30-60 seconds.', 'success');
    
    // TODO: Call API to generate speech video
    // For demo, show sample
    setTimeout(() => {
        showAlert('avatar-status', '✅ Video generated! Check your email.', 'success');
    }, 2000);
}

function shareAvatar() {
    const shareUrl = `${window.location.origin}/avatar/${currentUser.id}`;
    navigator.clipboard.writeText(shareUrl);
    showAlert('avatar-status', '📋 Avatar link copied to clipboard!', 'success');
}

function calculateTrainingTime(avatarData) {
    const start = new Date(avatarData.training_started_at);
    const end = new Date(avatarData.training_completed_at);
    const minutes = Math.round((end - start) / 60000);
    return minutes + ' minutes';
}

// Check avatar status on load
window.addEventListener('load', () => {
    setTimeout(checkAvatarStatus, 1000);
});

// Real-time updates
if (currentUser) {
    supabase
        .channel('avatar-updates')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'avatar_training',
                filter: `user_id=eq.${currentUser.id}`
            },
            (payload) => {
                console.log('Avatar updated:', payload.new);
                if (payload.new.status === 'completed') {
                    showAvatar(payload.new);
                } else {
                    checkTrainingProgress();
                }
            }
        )
        .subscribe();
}
```

### Step 4: Add CSS Styles

```css
/* Add to dashboard.html styles */

.avatar-display {
    padding: 2rem;
}

.avatar-card {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    align-items: start;
}

.avatar-video-wrapper {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    padding: 1rem;
}

.avatar-info {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
}

.avatar-info p {
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.badge.success {
    background: rgba(16, 185, 129, 0.2);
    color: var(--success);
}

.avatar-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    color: var(--text-primary);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
    .avatar-card {
        grid-template-columns: 1fr;
    }
}
```

### Step 5: Create Demo Avatar (For Testing)

Insert a demo avatar record:

```sql
-- In Supabase SQL Editor
INSERT INTO avatar_training (
    user_id,
    clone_id,
    status,
    progress,
    avatar_video_url,
    avatar_thumbnail_url,
    provider,
    training_started_at,
    training_completed_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'),
    (SELECT id FROM user_clones WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com') LIMIT 1),
    'completed',
    100,
    'https://www.youtube.com/embed/dQw4w9WgXcQ', -- Replace with actual video
    'https://via.placeholder.com/600x400/4f46e5/ffffff?text=Your+AI+Avatar',
    'demo',
    NOW() - INTERVAL '10 minutes',
    NOW()
);
```

## What User Sees

**1. During Training (5-10 min):**
```
🎬 Creating your AI avatar... 45%
[████████████░░░░░░░]
This usually takes 5-10 minutes. We'll notify you when it's ready.
```

**2. When Complete:**
```
✅ Your AI avatar is ready! It can now attend meetings on your behalf.

[Video Preview]
Status: Active
Created: Oct 19, 2025
Training Time: 8 minutes

[Test Avatar Speech] [Share Avatar]
```

**3. Test Speech:**
User clicks "Test Avatar Speech" → Types message → Avatar video generated saying that message

## Option 2: Real API Integration

Once you have API keys, replace demo with real integration:

### HeyGen Setup (Premium - Best Quality)
1. Sign up: https://app.heygen.com
2. Get API key
3. Deploy Edge Function: `supabase functions deploy create-avatar`
4. See: `AVATAR_GENERATION.md`

### D-ID Setup (Budget - Good Quality)
1. Sign up: https://studio.d-id.com
2. Get API key
3. See: `AVATAR_DID_INTEGRATION.md` (coming soon)

## Cost Comparison

**Demo Mode:** Free (just shows UI)
**D-ID:** $5.90/mo + $0.05 per video minute
**HeyGen:** $24/mo + $0.50 per avatar

## Next Steps

1. ✅ Run `sql/avatar-schema.sql`
2. ✅ Add avatar UI to dashboard
3. ✅ Insert demo record
4. ✅ Test the UI
5. ⏳ Get API keys (HeyGen or D-ID)
6. ⏳ Deploy Edge Functions
7. ⏳ Replace demo with real integration

**See:** `AVATAR_GENERATION.md` for complete API integration guide
