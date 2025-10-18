# NeuralMeet - Quick Start Implementation Guide

## 🚀 Week 1 Sprint Plan

### Day 1: Foundation Setup

**N8N Installation**
```bash
# Option 1: Docker (Recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Option 2: npm
npm install n8n -g
n8n start

# Access at: http://localhost:5678
```

**Initial Configuration:**
1. Create admin account
2. Enable webhook endpoint
3. Set environment variables for API keys

---

### Day 2: Calendar Integration

**Google Calendar N8N Workflow**
```
Trigger: Google Calendar (Watch Events)
  ↓
Filter: Keywords ["status", "sync", "standup", "update"]
  ↓
HTTP Request: POST to /api/meetings/analyze
  ↓
IF: meeting.priority == "low"
  → Clone Deployment
ELSE:
  → Notify user for manual decision
```

**Setup Steps:**
1. Create Google Cloud project
2. Enable Google Calendar API
3. Generate OAuth credentials
4. Connect in N8N
5. Test with real calendar event

**Test Command:**
```bash
curl -X POST http://localhost:5678/webhook/test-calendar \
  -H "Content-Type: application/json" \
  -d '{
    "meeting": {
      "title": "Weekly Status Update",
      "time": "2025-10-20T10:00:00Z",
      "attendees": ["team@company.com"]
    }
  }'
```

---

### Day 3: HeyGen Avatar Setup

**HeyGen Integration Steps:**

1. **Sign Up & API Access**
   - Go to heygen.com
   - Request API access (enterprise tier recommended)
   - Get API key from dashboard

2. **Voice Training**
   ```bash
   # Record voice samples
   # Requirements:
   # - 5+ minutes of clear speech
   # - Quiet environment
   # - Natural conversation tone
   # - Diverse sentences (not just reading)
   
   # Upload via HeyGen dashboard or API
   curl -X POST https://api.heygen.com/v1/voice/train \
     -H "X-Api-Key: YOUR_KEY" \
     -F "audio=@voice_sample.mp3" \
     -F "name=Executive Clone Voice"
   ```

3. **Avatar Creation**
   ```bash
   # Upload photos/video
   curl -X POST https://api.heygen.com/v1/avatars/create \
     -H "X-Api-Key: YOUR_KEY" \
     -F "video=@headshot.mp4" \
     -F "name=CEO Avatar"
   ```

4. **N8N Integration Node**
   ```javascript
   // Custom N8N node code
   const options = {
     method: 'POST',
     url: 'https://api.heygen.com/v1/video/generate',
     headers: {
       'X-Api-Key': '{{$credentials.heygenApi}}',
     },
     body: {
       avatar_id: '{{$node["Get Avatar"].json["id"]}}',
       text: '{{$node["Decision Engine"].json["response"]}}',
       voice_id: 'user_voice_clone',
     }
   };
   return await this.helpers.request(options);
   ```

---

### Day 4: Emily AI Voice Integration

**Setup Process:**

1. **Account Setup**
   - Visit emilyai.com (or alternative: ElevenLabs)
   - Sign up for API access
   - Upload 10-15 minutes of voice samples

2. **Voice Cloning**
   ```python
   # Example using ElevenLabs (similar to Emily AI)
   from elevenlabs import clone, generate, set_api_key
   
   set_api_key("YOUR_API_KEY")
   
   # Clone voice from samples
   voice = clone(
       name="Executive Voice",
       files=["sample1.mp3", "sample2.mp3", "sample3.mp3"]
   )
   
   # Generate speech
   audio = generate(
       text="I approve this budget allocation",
       voice=voice
   )
   ```

3. **N8N Workflow**
   ```
   Meeting Context
     ↓
   IF: video_required == true
     → Use HeyGen
   ELSE:
     → Use Emily AI voice
     ↓
   Generate Audio
     ↓
   Stream to Meeting Platform
   ```

---

### Day 5: Decision Engine Logic

**Rule Engine Structure:**

```yaml
# decision_rules.yaml
budget_approvals:
  auto_approve:
    - amount < 5000
    - category in ["office_supplies", "software_subscriptions"]
  
  conditional_approve:
    - amount >= 5000 AND amount < 25000
    - requires: "justification present"
  
  escalate:
    - amount >= 25000
    - category == "new_hire"
    - category == "capital_expenditure"

project_approvals:
  auto_approve:
    - timeline < 14_days
    - resources_available == true
    - conflicts_with_priorities == false
  
  escalate:
    - strategic_importance == "high"
    - cross_department == true
    - budget_impact > 50000
```

**N8N Implementation:**
```javascript
// Decision Engine Node
const decision = (meeting) => {
  const { topic, amount, category, participants } = meeting;
  
  // Budget logic
  if (topic.includes('budget')) {
    if (amount < 5000) {
      return {
        action: 'approve',
        response: `Approved. Budget of $${amount} is within auto-approval threshold.`,
        escalate: false
      };
    }
    
    if (amount >= 25000) {
      return {
        action: 'escalate',
        response: `This requires your approval. Budget of $${amount} exceeds my authority.`,
        escalate: true,
        notification: {
          channel: 'sms',
          priority: 'high'
        }
      };
    }
  }
  
  // Default to conservative escalation
  return {
    action: 'escalate',
    response: `I want to get your input on this before proceeding.`,
    escalate: true
  };
};
```

---

### Day 6-7: End-to-End Testing

**Test Scenarios:**

1. **Scenario 1: Low-Priority Meeting**
   ```
   Input: Status update meeting invite
   Expected: Clone joins, participates, no escalation
   Verify: Meeting summary generated
   ```

2. **Scenario 2: Budget Approval Under Threshold**
   ```
   Input: $3,000 software subscription request
   Expected: Auto-approved, confirmation sent
   Verify: Decision logged in database
   ```

3. **Scenario 3: Critical Escalation**
   ```
   Input: $50,000 new hire discussion
   Expected: Immediate SMS to user, clone declines decision
   Verify: Notification received within 30 seconds
   ```

**Testing Workflow:**
```bash
# Run test suite
npm run test:integration

# Manual testing checklist:
# [ ] Calendar trigger fires correctly
# [ ] Meeting classification accurate
# [ ] Clone voice quality acceptable
# [ ] Decision rules apply correctly
# [ ] Escalations trigger notifications
# [ ] Meeting summaries complete
# [ ] Database logging working
```

---

## 📊 Monitoring & Debugging

**N8N Logging:**
```javascript
// Add to each workflow node
console.log('Node: Calendar Trigger', {
  timestamp: new Date(),
  meeting: meeting.title,
  decision: decision.action
});
```

**Database Queries:**
```sql
-- Check recent decisions
SELECT * FROM clone_decisions 
ORDER BY created_at DESC 
LIMIT 10;

-- Escalation rate
SELECT 
  COUNT(CASE WHEN escalated = true THEN 1 END) as escalations,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN escalated = true THEN 1 END)::numeric / COUNT(*) * 100, 2) as escalation_rate
FROM clone_decisions
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🔧 Common Issues & Solutions

**Issue 1: HeyGen video quality poor**
- Solution: Re-train with better source video (1080p, good lighting)

**Issue 2: Voice clone sounds robotic**
- Solution: Provide more diverse training samples with natural conversation

**Issue 3: Calendar triggers missing events**
- Solution: Check webhook endpoint, verify OAuth token refresh

**Issue 4: Decision engine too conservative**
- Solution: Adjust thresholds in decision rules, add more specific conditions

**Issue 5: High latency in clone responses**
- Solution: Implement response caching, optimize API calls, use streaming

---

## 📦 Required API Keys Checklist

```bash
# Add to N8N environment variables
export GOOGLE_CALENDAR_CLIENT_ID="..."
export GOOGLE_CALENDAR_CLIENT_SECRET="..."
export HEYGEN_API_KEY="..."
export EMILY_AI_API_KEY="..."
export OPENAI_API_KEY="..."
export DEEPGRAM_API_KEY="..."
export TWILIO_ACCOUNT_SID="..."
export TWILIO_AUTH_TOKEN="..."
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."
```

---

## 🎯 Success Criteria (Week 1)

- [ ] N8N running and accessible
- [ ] Google Calendar integration working
- [ ] One successful test meeting with clone
- [ ] HeyGen avatar generated
- [ ] Emily AI voice clone created
- [ ] Basic decision rules functioning
- [ ] Escalation notification system operational
- [ ] Meeting summary generation working

---

## 📈 Week 2 Preview

- Zoom/Meet/Teams bot deployment
- Real-time transcription integration
- Advanced decision logic with ML
- User feedback interface
- Performance optimization
- Security hardening

---

## 🆘 Support Resources

- N8N Community: https://community.n8n.io
- HeyGen Support: support@heygen.com
- Technical Issues: Create GitHub issue in this repo

**Ready to build?** Start with Day 1 and work through sequentially. Each day builds on the previous.
