# NeuralMeet System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CALENDAR                           │
│                    (Google/Outlook/iCal)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      N8N ORCHESTRATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Calendar   │→│   Meeting    │→│   Decision   │         │
│  │   Trigger    │  │  Classifier  │  │    Engine    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │    HeyGen    │ │   Emily AI   │ │   OpenAI     │
    │    Avatar    │ │    Voice     │ │  GPT-4 NLP   │
    │  Generation  │ │   Cloning    │ │   Analysis   │
    └──────────────┘ └──────────────┘ └──────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MEETING PLATFORMS                            │
│         Zoom API  |  Google Meet  |  MS Teams                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  INTELLIGENCE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Transcription │→│  Action Item │→│   Meeting    │         │
│  │  (Deepgram)  │  │  Extraction  │  │   Archive    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ESCALATION SYSTEM                            │
│         SMS (Twilio)  |  Slack  |  Email  |  Dashboard         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Calendar Integration Layer

**Purpose:** Monitor and intercept meeting invites

**Components:**
- Google Calendar API webhook
- Microsoft Graph API for Outlook
- iCal parser for other calendars

**Data Flow:**
```
Calendar Event Created
  ↓
Webhook triggers N8N
  ↓
Extract: Title, Attendees, Time, Description
  ↓
Pass to Meeting Classifier
```

**Key Decisions:**
- Real-time vs polling: Use webhooks for <30s latency
- Multi-calendar support: Unified webhook endpoint
- Event modifications: Listen for updates/cancellations

---

### 2. Meeting Classification Engine

**Purpose:** Determine if meeting needs clone or human

**Classification Logic:**
```javascript
function classifyMeeting(event) {
  const signals = {
    lowPriority: [
      event.title.match(/status|sync|standup|update/i),
      event.attendees.length > 10,
      event.duration < 30,
      event.recurring === true
    ],
    
    highPriority: [
      event.title.match(/board|investor|strategic|executive/i),
      event.organizer.domain !== company.domain,
      event.attendees.includes(CEO) || event.attendees.includes(board_members),
      event.flagged_by_user === true
    ]
  };
  
  if (highPriority.some(x => x)) return 'ATTEND_PERSONALLY';
  if (lowPriority.filter(x => x).length >= 2) return 'SEND_CLONE';
  return 'ASK_USER';
}
```

**Machine Learning Enhancement (Phase 2):**
- Train classifier on historical decisions
- Features: title embeddings, attendee patterns, outcomes
- Model: XGBoost or lightweight neural network
- Confidence threshold: >85% for auto-decisions

---

### 3. Decision Engine Architecture

**Core Logic:**
```
Meeting Context
  ↓
Extract Decision Points (GPT-4)
  ↓
Match Against Rule Database
  ↓
├─ Rule Match → Execute Decision
└─ No Match → Default to Escalation
  ↓
Generate Response (Voice/Text)
  ↓
Log Decision + Rationale
```

**Rule Storage:**
```json
{
  "user_id": "exec_001",
  "rules": [
    {
      "id": "budget_rule_1",
      "category": "budget_approval",
      "conditions": {
        "amount": {"$lt": 5000},
        "category": {"$in": ["software", "supplies"]}
      },
      "action": "auto_approve",
      "response_template": "Approved. {amount} is within threshold."
    }
  ]
}
```

**Execution Flow:**
```python
def make_decision(context, user_rules):
    # Extract decision points
    decision_points = extract_decisions(context)
    
    for point in decision_points:
        # Match rules
        matched_rule = match_rule(point, user_rules)
        
        if matched_rule:
            action = execute_rule(matched_rule, point)
            response = generate_response(matched_rule.template, point)
            log_decision(point, action, matched_rule)
            
            if action == 'escalate':
                send_notification(user, point, 'sms')
            
            return {'action': action, 'response': response}
    
    # Default: escalate unknown scenarios
    return escalate_to_user(point)
```

---

### 4. Voice/Video Generation Pipeline

**HeyGen Integration:**
```
Decision Made
  ↓
Generate Script (GPT-4)
  ↓
Call HeyGen API
  ├─ avatar_id: user's trained avatar
  ├─ text: decision response
  ├─ voice_id: cloned voice
  └─ options: emotion, pace, emphasis
  ↓
Receive Video Stream URL
  ↓
Inject into Meeting Platform
```

**API Call:**
```bash
POST https://api.heygen.com/v1/video/generate
{
  "avatar_id": "avatar_abc123",
  "voice_id": "voice_xyz789",
  "text": "I approve this budget allocation of $3,500 for the new CRM tool. Please proceed with procurement.",
  "background": "office",
  "emotion": "professional_confident",
  "speed": 1.0
}

Response:
{
  "video_id": "vid_def456",
  "stream_url": "https://stream.heygen.com/vid_def456",
  "status": "processing",
  "estimated_time": 15
}
```

**Emily AI (Audio-Only):**
```
Decision Made
  ↓
Generate Script
  ↓
Call Emily AI TTS
  ↓
Stream Audio to Meeting
```

**Latency Optimization:**
- Pre-generate common responses
- Stream audio/video (don't wait for completion)
- Cache frequent phrases
- Target: <2s from decision to speech start

---

### 5. Meeting Platform Integration

**Zoom Bot Architecture:**
```
N8N Workflow
  ↓
Create Zoom Meeting Bot
  ↓
Bot Joins as Participant
  ├─ Video: Stream HeyGen output
  ├─ Audio: Stream Emily AI output
  └─ Listen: Capture all audio for transcription
  ↓
Participate in Real-Time
  ↓
Leave when meeting ends
```

**Technical Implementation:**
```javascript
// Zoom Meeting SDK
const ZoomClient = require('@zoom/meetingsdk');

async function joinMeeting(meetingId, password) {
  const client = ZoomClient.createClient();
  
  await client.init({
    zoomAppKey: process.env.ZOOM_SDK_KEY,
    zoomAppSecret: process.env.ZOOM_SDK_SECRET,
  });
  
  await client.join({
    meetingNumber: meetingId,
    password: password,
    userName: 'Neural Clone',
    userEmail: 'clone@neuralmeet.ai',
    tk: generateJWT()
  });
  
  // Stream custom video
  await client.stream({
    videoStream: heygenVideoStream,
    audioStream: emilyAudioStream
  });
  
  // Listen for speech
  client.on('audio-data', (data) => {
    transcribeAndAnalyze(data);
  });
}
```

**Similar patterns for:**
- Google Meet: Meet Add-on API
- Microsoft Teams: Bot Framework + Graph API

---

### 6. Transcription & Intelligence

**Real-Time Processing:**
```
Audio Stream from Meeting
  ↓
Deepgram WebSocket
  ↓
Real-Time Transcription
  ↓
┌──────────────┬──────────────┬──────────────┐
│              │              │              │
↓              ↓              ↓              ↓
Sentiment    Action Items   Decision Points  Speaker
Analysis                                    Diarization
```

**Deepgram Configuration:**
```javascript
const deepgram = new Deepgram(API_KEY);
const stream = deepgram.transcription.live({
  punctuate: true,
  interim_results: true,
  model: 'nova-2',
  smart_format: true,
  diarize: true
});

stream.on('transcriptReceived', (transcript) => {
  // Extract action items with GPT-4
  const actions = extractActionItems(transcript.channel.alternatives[0].transcript);
  
  // Detect decision points
  if (isDecisionPoint(transcript)) {
    triggerDecisionEngine(transcript);
  }
});
```

**Post-Meeting Processing:**
```
Meeting Ends
  ↓
Generate Summary (GPT-4)
  ├─ Key Decisions Made
  ├─ Action Items with Owners
  ├─ Open Questions
  └─ Next Steps
  ↓
Store in Database
  ↓
Send to User via Email/Slack
```

---

### 7. Escalation System

**Notification Priority Matrix:**
```
┌─────────────┬──────────┬──────────┬──────────┐
│   Urgency   │ Channel  │ Latency  │  Retry   │
├─────────────┼──────────┼──────────┼──────────┤
│ Critical    │ SMS +    │ <30s     │ 3x/5min  │
│             │ Phone    │          │          │
├─────────────┼──────────┼──────────┼──────────┤
│ High        │ Slack DM │ <1min    │ 2x/10min │
├─────────────┼──────────┼──────────┼──────────┤
│ Medium      │ Email    │ <5min    │ 1x       │
├─────────────┼──────────┼──────────┼──────────┤
│ Low         │ Daily    │ EOD      │ None     │
│             │ Digest   │          │          │
└─────────────┴──────────┴──────────┴──────────┘
```

**Implementation:**
```python
def escalate(decision_point, priority):
    notification = {
        'user': decision_point.user_id,
        'context': decision_point.context,
        'urgency': priority,
        'timestamp': datetime.now()
    }
    
    if priority == 'critical':
        send_sms(user.phone, notification)
        schedule_phone_call(user.phone, notification, delay=60)
        send_slack_dm(user.slack_id, notification)
    
    elif priority == 'high':
        send_slack_dm(user.slack_id, notification)
        if not acknowledged_within(notification, 300):
            send_sms(user.phone, notification)
    
    elif priority == 'medium':
        send_email(user.email, notification)
    
    else:
        add_to_daily_digest(notification)
    
    log_escalation(notification)
```

---

### 8. Data Storage Architecture

**Database Schema:**
```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  company_id UUID,
  voice_clone_id VARCHAR(255),
  avatar_id VARCHAR(255),
  created_at TIMESTAMP
);

-- Decision Rules
CREATE TABLE decision_rules (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category VARCHAR(100),
  conditions JSONB,
  action VARCHAR(50),
  response_template TEXT,
  priority INTEGER
);

-- Meeting Archive
CREATE TABLE meetings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  calendar_event_id VARCHAR(255),
  title VARCHAR(500),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  attendees JSONB,
  clone_attended BOOLEAN,
  platform VARCHAR(50)
);

-- Decisions Log
CREATE TABLE clone_decisions (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id),
  decision_point TEXT,
  rule_applied UUID REFERENCES decision_rules(id),
  action_taken VARCHAR(100),
  response_text TEXT,
  escalated BOOLEAN,
  confidence_score FLOAT,
  created_at TIMESTAMP
);

-- Meeting Transcripts
CREATE TABLE transcripts (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id),
  full_text TEXT,
  speakers JSONB,
  action_items JSONB,
  summary TEXT,
  sentiment_score FLOAT
);
```

**Indexes for Performance:**
```sql
CREATE INDEX idx_meetings_user_time ON meetings(user_id, start_time DESC);
CREATE INDEX idx_decisions_meeting ON clone_decisions(meeting_id);
CREATE INDEX idx_rules_category ON decision_rules(user_id, category);
```

---

## Security Architecture

**Data Protection:**
```
┌─────────────────────────────────────────────┐
│         Encryption Layer (TLS 1.3)          │
├─────────────────────────────────────────────┤
│   Meeting Data     │   Encryption at Rest   │
│   (In Transit)     │   AES-256             │
├────────────────────┼────────────────────────┤
│   Voice Samples    │   Encrypted Storage    │
│   (Training)       │   + Access Control     │
├────────────────────┼────────────────────────┤
│   Transcripts      │   Time-bound Retention │
│   (Archives)       │   User-controlled      │
└─────────────────────────────────────────────┘
```

**Access Control:**
- JWT authentication for all API calls
- OAuth 2.0 for calendar integrations
- Role-based permissions (admin, user, clone)
- API rate limiting: 100 req/min per user

**Compliance:**
- SOC 2 Type II certification roadmap
- GDPR: Right to erasure, data portability
- HIPAA: No PHI in transcripts by default
- Data residency options per region

---

## Scalability Considerations

**Current Architecture:**
- Handles: ~100 concurrent meetings
- Latency: <3s decision → response
- Cost: $500-800 per enterprise user/month

**Scale to 10,000 Users:**
```
┌─────────────────┬────────────┬──────────────┐
│   Component     │  Current   │   At Scale   │
├─────────────────┼────────────┼──────────────┤
│ N8N Instances   │     1      │   10 (LB)    │
│ DB (Postgres)   │   Single   │   Cluster    │
│ Redis Cache     │   1 node   │   Cluster    │
│ Video Streaming │   CDN      │   Multi-CDN  │
│ API Gateway     │   Direct   │   Kong/Apigee│
└─────────────────┴────────────┴──────────────┘
```

**Cost Optimization:**
- Cache frequent responses (50% cost reduction)
- Batch non-urgent processing
- Tiered storage (hot/warm/cold for transcripts)
- Auto-scale based on meeting load

---

## Deployment Architecture

**Infrastructure:**
```
┌──────────────────────────────────────────┐
│           AWS/GCP Cloud                  │
├──────────────────────────────────────────┤
│  Load Balancer (ALB/Cloud Load Balancer)│
├──────────────────────────────────────────┤
│  N8N Cluster (ECS/GKE) - Auto-scaling   │
├──────────────────────────────────────────┤
│  Application Servers (Fargate/Cloud Run)│
├──────────────────────────────────────────┤
│  Database (RDS/Cloud SQL) + Read Replicas│
├──────────────────────────────────────────┤
│  Redis (ElastiCache/Memorystore)        │
├──────────────────────────────────────────┤
│  Object Storage (S3/GCS) - Recordings   │
└──────────────────────────────────────────┘
```

---

## Monitoring & Observability

**Key Metrics:**
- Meeting join success rate: >99%
- Clone response latency: p95 <2s
- Decision accuracy: >90%
- Escalation precision: >95%
- API uptime: >99.9%

**Tools:**
- Datadog: Infrastructure monitoring
- Sentry: Error tracking
- LogRocket: Session replay for debugging
- Custom: Decision accuracy dashboard

---

This architecture is designed for:
- **Reliability:** Redundancy at every layer
- **Scalability:** Horizontal scaling for all components
- **Security:** Defense in depth, encryption everywhere
- **Performance:** Sub-2s latency for critical paths
- **Cost-efficiency:** Optimize for $500-800/user/month margins

Next: Implement Phase 1 (Calendar + HeyGen + Basic Decisions)
