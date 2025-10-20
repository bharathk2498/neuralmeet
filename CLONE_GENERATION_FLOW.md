# AI Clone Generation Flow

## **Complete User Journey**

### **Step 1: User Uploads Files**
1. **Voice Sample** (audio/video file)
   - MP3, WAV, M4A, MOV formats
   - Max 100MB
   - Used for voice cloning by D-ID

2. **Avatar Photo** (image/video)
   - JPG, PNG, MP4 formats
   - Clear front-facing shot
   - Used as the visual avatar by D-ID

### **Step 2: User Fills Details**
3. **Communication Style** (text field)
   - Speaking style, common phrases, tone preferences
   - Used for training the conversational AI

4. **Decision-Making Approach** (text field)
   - How they make decisions, priorities
   - Used for autonomous meeting decisions

### **Step 3: Preview & Confirm**
- Show uploaded files with previews
- Display file sizes and names
- Show communication style summary
- **USER MUST CONFIRM** before generation starts

### **Step 4: Generate AI Clone**
Once user confirms:

#### **4.1 Frontend → Backend**
```javascript
POST /api/clone/create
FormData {
  audio: voiceFile,
  image: videoFile,
  communicationStyle: "...",
  decisionStyle: "..."
}
```

#### **4.2 Backend Processing**
Located in: `backend/services/didService.js`

```javascript
1. Receive files from frontend
2. Upload audio to D-ID: POST https://api.d-id.com/audios
3. Upload image to D-ID: POST https://api.d-id.com/images
4. Create talking avatar: POST https://api.d-id.com/talks
   {
     source_url: imageId,
     audio_url: audioId,
     config: { fluent: true, pad_audio: 0 }
   }
5. Return talk_id to frontend
```

#### **4.3 Status Polling**
```javascript
1. Frontend polls: GET /api/clone/status/:talkId
2. Backend checks: GET https://api.d-id.com/talks/:talkId
3. Status progression:
   - created → started → processing → done
4. When done: return result_url (video)
```

#### **4.4 Display Result**
- Video player shows generated avatar
- User can download or use in meetings

---

## **D-ID API Integration**

### **Authentication**
```javascript
Headers: {
  'Authorization': 'Basic ' + DID_API_KEY,
  'Content-Type': 'application/json'
}
```

### **Key Endpoints Used**

**1. Upload Audio**
```
POST https://api.d-id.com/audios
Body: FormData with audio file
Response: { audio_id }
```

**2. Upload Image**
```
POST https://api.d-id.com/images
Body: FormData with image file
Response: { image_id, source_url }
```

**3. Create Talk (Generate Avatar)**
```
POST https://api.d-id.com/talks
Body: {
  source_url: image_id,
  audio_url: audio_id,
  config: {
    fluent: true,
    pad_audio: 0,
    driver_expressions: {
      expressions: [
        { start_frame: 0, expression: 'neutral', intensity: 1 }
      ]
    }
  }
}
Response: { id: talk_id, status: 'created' }
```

**4. Check Status**
```
GET https://api.d-id.com/talks/:talk_id
Response: {
  id: talk_id,
  status: 'done',
  result_url: 'https://d-id-talks-prod.s3.amazonaws.com/...'
}
```

---

## **Current Implementation Status**

### ✅ **Configured & Ready**
- Frontend upload UI
- Mock mode for testing UI
- Backend D-ID service (`backend/services/didService.js`)
- Backend routes (`backend/routes/clone.js`)
- API key management (secure backend)

### ⏸️ **Pending Deployment**
- Backend to Render (when ready to test real API)
- D-ID API key in Render environment variables

---

## **Testing Modes**

### **Mode 1: Mock (Current)**
```javascript
MOCK_MODE: true in js/backend-config.js
```
- No backend required
- Simulates entire flow
- Shows placeholder images
- **Use for UI testing**

### **Mode 2: Production**
```javascript
MOCK_MODE: false in js/backend-config.js
```
- Requires backend deployed on Render
- Uses real D-ID API
- Generates actual avatar videos
- **Use after backend deployment**

---

## **Backend Files Structure**

```
backend/
├── server.js                    # Express server
├── config/
│   └── config.js               # Environment config + CORS
├── routes/
│   └── clone.js                # API routes
└── services/
    └── didService.js           # D-ID API integration
```

### **Key Backend File: `backend/services/didService.js`**

```javascript
const axios = require('axios');
const FormData = require('form-data');

class DIDService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.d-id.com';
  }

  // Upload audio to D-ID
  async uploadAudio(audioBuffer, filename) {
    const formData = new FormData();
    formData.append('audio', audioBuffer, filename);
    
    const response = await axios.post(
      `${this.baseUrl}/audios`,
      formData,
      {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          ...formData.getHeaders()
        }
      }
    );
    
    return response.data.url;
  }

  // Upload image to D-ID
  async uploadImage(imageBuffer, filename) {
    const formData = new FormData();
    formData.append('image', imageBuffer, filename);
    
    const response = await axios.post(
      `${this.baseUrl}/images`,
      formData,
      {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          ...formData.getHeaders()
        }
      }
    );
    
    return response.data.url;
  }

  // Create talking avatar
  async createTalk(imageUrl, audioUrl) {
    const response = await axios.post(
      `${this.baseUrl}/talks`,
      {
        source_url: imageUrl,
        audio_url: audioUrl,
        config: {
          fluent: true,
          pad_audio: 0
        }
      },
      {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  }

  // Check status
  async getTalkStatus(talkId) {
    const response = await axios.get(
      `${this.baseUrl}/talks/${talkId}`,
      {
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      }
    );
    
    return response.data;
  }
}

module.exports = DIDService;
```

---

## **Complete Flow Diagram**

```
User Uploads
    ↓
Preview & Confirm
    ↓
Frontend sends to Backend
    ↓
Backend uploads to D-ID
    ↓ (audio_id, image_id)
Backend creates Talk
    ↓ (talk_id)
Frontend polls status
    ↓ (created → processing → done)
Display video result
```

---

## **Timeline Expectations**

1. **Upload to backend**: 2-5 seconds
2. **Upload to D-ID**: 5-10 seconds
3. **D-ID processing**: 60-180 seconds
4. **Total time**: ~2-3 minutes

---

## **Next Steps to Go Live**

1. ✅ Test UI with mock mode (current)
2. Deploy backend to Render
3. Add D-ID API key to Render env vars
4. Change `MOCK_MODE: false`
5. Test real generation
6. Launch! 🚀