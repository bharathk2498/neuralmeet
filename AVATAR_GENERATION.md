# AI Avatar Generation System

## Architecture Overview

```
User Uploads → Storage → Processing Queue → AI Services → Avatar Ready
     ↓              ↓              ↓              ↓            ↓
  Voice/Video   Supabase     Webhook/Queue   HeyGen/D-ID   Database
```

## Service Options & Costs

### Voice Cloning Services

| Service | Quality | Latency | Cost | API |
|---------|---------|---------|------|-----|
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | ~3-5s | $1/mo (10k chars) | ✅ Easy |
| **Play.ht** | ⭐⭐⭐⭐ | ~2-3s | $39/mo (500k words) | ✅ Easy |
| **Resemble AI** | ⭐⭐⭐⭐ | ~4-6s | $0.006/sec | ✅ Good |
| **Coqui.ai** | ⭐⭐⭐ | ~5-10s | Free (self-host) | ⚠️ Complex |

**Recommended: ElevenLabs** (best quality, easiest API)

### Video Avatar Services

| Service | Realism | Speed | Cost | API |
|---------|---------|-------|------|-----|
| **HeyGen** | ⭐⭐⭐⭐⭐ | 1-3 min | $24/mo (5 min video) | ✅ Best |
| **D-ID** | ⭐⭐⭐⭐ | 30-60s | $5.90/mo (5 min video) | ✅ Good |
| **Synthesia** | ⭐⭐⭐⭐⭐ | 2-5 min | $30/mo (10 min video) | ⚠️ Enterprise |
| **Rask.ai** | ⭐⭐⭐ | 1-2 min | $60/mo | ✅ OK |

**Recommended: HeyGen** (most realistic, good API)

### Complete Solution Stack

**Option 1: HeyGen (Easiest - All-in-One)**
- ✅ Handles both voice cloning + video avatar
- ✅ Single API integration
- ✅ Best quality results
- ❌ Most expensive ($24-89/mo)

**Option 2: ElevenLabs + D-ID (Balanced)**
- ✅ Better pricing ($6.90-40/mo combined)
- ✅ Excellent voice quality
- ✅ Good video quality
- ⚠️ Two API integrations

**Option 3: Open Source (Cheapest)**
- ✅ Free (pay for compute)
- ✅ Full control
- ❌ Complex setup
- ❌ Lower quality

## Implementation: HeyGen Integration (Recommended)

### Step 1: Database Schema

```sql
-- Avatar training and status tracking
CREATE TABLE avatar_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clone_id UUID REFERENCES user_clones(id) ON DELETE CASCADE,
    
    -- HeyGen API references
    heygen_avatar_id TEXT,
    heygen_voice_id TEXT,
    
    -- Training status
    status TEXT DEFAULT 'pending', -- pending, processing, training, completed, failed
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Media URLs
    avatar_video_url TEXT,
    avatar_thumbnail_url TEXT,
    sample_video_url TEXT,
    
    -- Metadata
    training_started_at TIMESTAMPTZ,
    training_completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs for debugging
CREATE TABLE avatar_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avatar_training_id UUID REFERENCES avatar_training(id),
    event_type TEXT,
    payload JSONB,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE avatar_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_webhooks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own avatars
CREATE POLICY "Users view own avatars"
ON avatar_training FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users view own webhook logs"
ON avatar_webhooks FOR SELECT
TO authenticated
USING (avatar_training_id IN (
    SELECT id FROM avatar_training WHERE user_id = auth.uid()
));
```

### Step 2: Supabase Edge Function (Avatar Processing)

Create file: `supabase/functions/create-avatar/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY')!
const HEYGEN_API_URL = 'https://api.heygen.com/v2'

serve(async (req) => {
  try {
    const { cloneId, userId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Get uploaded media files
    const { data: voiceSamples } = await supabase
      .from('voice_samples')
      .select('file_path')
      .eq('clone_id', cloneId)
      .limit(5) // HeyGen needs 2-5 voice samples

    const { data: videoSamples } = await supabase
      .from('video_samples')
      .select('file_path')
      .eq('clone_id', cloneId)
      .limit(1) // HeyGen needs 1 video sample (2+ min)

    if (!voiceSamples?.length || !videoSamples?.length) {
      throw new Error('Missing voice or video samples')
    }

    // 2. Get signed URLs for HeyGen to access files
    const voiceUrls = await Promise.all(
      voiceSamples.map(async (s) => {
        const { data } = await supabase.storage
          .from('voice-samples')
          .createSignedUrl(s.file_path, 3600) // 1 hour expiry
        return data?.signedUrl
      })
    )

    const videoUrl = await supabase.storage
      .from('video-samples')
      .createSignedUrl(videoSamples[0].file_path, 3600)

    // 3. Create avatar training record
    const { data: training, error: dbError } = await supabase
      .from('avatar_training')
      .insert({
        user_id: userId,
        clone_id: cloneId,
        status: 'processing',
        training_started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 4. Submit to HeyGen API - Voice Training
    const voiceResponse = await fetch(`${HEYGEN_API_URL}/voice.clone`, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        voice_name: `user_${userId}_voice`,
        audio_urls: voiceUrls.filter(Boolean)
      })
    })

    const voiceData = await voiceResponse.json()
    
    if (!voiceResponse.ok) {
      throw new Error(`HeyGen voice error: ${voiceData.message}`)
    }

    // 5. Submit to HeyGen API - Avatar Training
    const avatarResponse = await fetch(`${HEYGEN_API_URL}/avatar.create`, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        avatar_name: `user_${userId}_avatar`,
        video_url: videoUrl.data?.signedUrl,
        voice_id: voiceData.data.voice_id,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/avatar-webhook`
      })
    })

    const avatarData = await avatarResponse.json()

    if (!avatarResponse.ok) {
      throw new Error(`HeyGen avatar error: ${avatarData.message}`)
    }

    // 6. Update training record with HeyGen IDs
    await supabase
      .from('avatar_training')
      .update({
        heygen_avatar_id: avatarData.data.avatar_id,
        heygen_voice_id: voiceData.data.voice_id,
        status: 'training',
        progress: 10
      })
      .eq('id', training.id)

    return new Response(
      JSON.stringify({
        success: true,
        training_id: training.id,
        heygen_avatar_id: avatarData.data.avatar_id,
        estimated_time: '5-10 minutes'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Avatar creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 3: Webhook Handler (Status Updates)

Create file: `supabase/functions/avatar-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log webhook for debugging
    await supabase.from('avatar_webhooks').insert({
      event_type: payload.event_type,
      payload: payload
    })

    // Find training record by HeyGen avatar ID
    const { data: training } = await supabase
      .from('avatar_training')
      .select('id, user_id, clone_id')
      .eq('heygen_avatar_id', payload.data.avatar_id)
      .single()

    if (!training) {
      console.warn('Training record not found for:', payload.data.avatar_id)
      return new Response('OK', { status: 200 })
    }

    // Update based on event type
    switch (payload.event_type) {
      case 'avatar.training_progress':
        await supabase
          .from('avatar_training')
          .update({
            progress: payload.data.progress || 50,
            status: 'training'
          })
          .eq('id', training.id)
        break

      case 'avatar.training_completed':
        await supabase
          .from('avatar_training')
          .update({
            status: 'completed',
            progress: 100,
            avatar_video_url: payload.data.video_url,
            avatar_thumbnail_url: payload.data.thumbnail_url,
            sample_video_url: payload.data.sample_video_url,
            training_completed_at: new Date().toISOString()
          })
          .eq('id', training.id)

        // Update clone status
        await supabase
          .from('user_clones')
          .update({
            training_status: 'completed',
            avatar_ready: true
          })
          .eq('id', training.clone_id)
        break

      case 'avatar.training_failed':
        await supabase
          .from('avatar_training')
          .update({
            status: 'failed',
            error_message: payload.data.error || 'Training failed'
          })
          .eq('id', training.id)
        break
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
})
```

### Step 4: Dashboard Frontend Integration

Add to `dashboard.html`:

```javascript
// After file upload completes, trigger avatar creation
async function triggerAvatarCreation(cloneId) {
    try {
        showAlert('clone-alert', '🎬 Creating your AI avatar...', 'success');
        
        const { data, error } = await supabase.functions.invoke('create-avatar', {
            body: {
                cloneId: cloneId,
                userId: currentUser.id
            }
        });

        if (error) throw error;

        console.log('Avatar creation started:', data);
        
        // Show progress modal
        showAvatarProgressModal(data.training_id);
        
    } catch (error) {
        console.error('Avatar creation error:', error);
        showAlert('clone-alert', 'Avatar creation failed: ' + error.message, 'error');
    }
}

// Poll for avatar training status
async function checkAvatarStatus(trainingId) {
    const { data, error } = await supabase
        .from('avatar_training')
        .select('*')
        .eq('id', trainingId)
        .single();

    if (error) {
        console.error('Status check error:', error);
        return null;
    }

    return data;
}

// Real-time updates using Supabase Realtime
function subscribeToAvatarUpdates(trainingId) {
    const channel = supabase
        .channel(`avatar-${trainingId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'avatar_training',
                filter: `id=eq.${trainingId}`
            },
            (payload) => {
                console.log('Avatar update:', payload.new);
                updateAvatarProgressUI(payload.new);
            }
        )
        .subscribe();

    return channel;
}

function updateAvatarProgressUI(trainingData) {
    const progressBar = document.getElementById('avatar-progress-bar');
    const statusText = document.getElementById('avatar-status-text');
    
    if (progressBar) {
        progressBar.style.width = trainingData.progress + '%';
    }
    
    if (statusText) {
        const messages = {
            'processing': 'Processing your media files...',
            'training': `Training your avatar... ${trainingData.progress}%`,
            'completed': '✅ Avatar ready!',
            'failed': '❌ Training failed'
        };
        statusText.textContent = messages[trainingData.status] || 'Processing...';
    }

    if (trainingData.status === 'completed') {
        showAvatarPreview(trainingData);
    }
}

function showAvatarPreview(trainingData) {
    const previewContainer = document.getElementById('avatar-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
        <div class="avatar-preview-card">
            <h3>🎉 Your AI Avatar is Ready!</h3>
            <video controls width="400" poster="${trainingData.avatar_thumbnail_url}">
                <source src="${trainingData.avatar_video_url}" type="video/mp4">
            </video>
            <button class="btn btn-primary" onclick="testAvatar('${trainingData.id}')">
                Test Avatar
            </button>
        </div>
    `;
}

async function testAvatar(trainingId) {
    // Generate test video with avatar saying something
    const testText = "Hello! I'm your AI clone. I'm ready to attend meetings on your behalf.";
    
    showAlert('clone-alert', 'Generating test video...', 'success');
    
    try {
        const { data: training } = await supabase
            .from('avatar_training')
            .select('heygen_avatar_id, heygen_voice_id')
            .eq('id', trainingId)
            .single();

        // Call HeyGen API to generate video
        const response = await fetch('https://api.heygen.com/v2/video.generate', {
            method: 'POST',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY, // Store in Supabase secrets
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                avatar_id: training.heygen_avatar_id,
                voice_id: training.heygen_voice_id,
                input_text: testText
            })
        });

        const result = await response.json();
        
        if (result.data?.video_url) {
            showVideoModal(result.data.video_url);
        }

    } catch (error) {
        console.error('Test generation error:', error);
        showAlert('clone-alert', 'Test failed: ' + error.message, 'error');
    }
}
```

### Step 5: Avatar Progress Modal UI

Add to dashboard.html styles:

```css
.avatar-progress-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.avatar-progress-content {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 3rem;
    max-width: 500px;
    text-align: center;
}

.avatar-progress-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.avatar-progress-bar {
    width: 100%;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
    margin: 2rem 0;
}

.avatar-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    transition: width 0.5s ease;
}

.avatar-preview-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
}

.avatar-preview-card video {
    border-radius: 12px;
    margin: 1.5rem 0;
    width: 100%;
    max-width: 400px;
}
```

Add modal HTML:

```html
<!-- Add before closing </body> -->
<div id="avatar-progress-modal" class="avatar-progress-modal" style="display: none;">
    <div class="avatar-progress-content">
        <div class="avatar-progress-icon">🎭</div>
        <h2>Creating Your AI Avatar</h2>
        <p id="avatar-status-text">Processing your media files...</p>
        <div class="avatar-progress-bar">
            <div class="avatar-progress-fill" id="avatar-progress-bar" style="width: 0%"></div>
        </div>
        <p class="text-muted">This usually takes 5-10 minutes</p>
    </div>
</div>

<div id="avatar-preview" style="margin-top: 2rem;"></div>
```

## Next Steps

1. **Get API Keys:**
   - Sign up: https://app.heygen.com
   - Get API key from dashboard
   - Add to Supabase secrets

2. **Deploy Edge Functions:**
```bash
supabase functions deploy create-avatar
supabase functions deploy avatar-webhook
```

3. **Set Environment Variables:**
```bash
supabase secrets set HEYGEN_API_KEY=your_key_here
```

4. **Test the Flow:**
   - Upload voice + video
   - Click "Train AI Clone"
   - Watch progress modal
   - Preview avatar when complete

## Alternative: D-ID + ElevenLabs (Cheaper)

See: `AVATAR_DID_INTEGRATION.md` for D-ID implementation

## Cost Estimate

**Per User Avatar Creation:**
- HeyGen: $0.50 - $2.00
- D-ID + ElevenLabs: $0.20 - $0.80
- Storage: $0.01 - $0.05
- **Total: $0.20 - $2.00 per avatar**

Ready to implement?
