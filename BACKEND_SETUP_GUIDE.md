# Backend Setup Guide - D-ID Integration

## Critical: Your API Key is Already Exposed

**First Action Required:**
Go to studio.d-id.com and regenerate your API key immediately. The key you shared has been exposed.

## Step 1: Add API Key to GitHub Secrets

This keeps your key secure in production deployments.

1. Navigate to: https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
2. Click **New repository secret**
3. Name: `DID_API_KEY`
4. Value: Your NEW D-ID API key after regeneration
5. Click **Add secret**

## Step 2: Local Development Setup

### Create Local Environment File

In your project root, create a `.env` file:

```bash
cd backend
nano .env
```

Add this content with your NEW key:

```
DID_API_KEY=your_new_regenerated_key_here
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Save and exit.

### Install Dependencies

```bash
npm install
```

### Start Backend Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Step 3: Verify Setup

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T...",
  "environment": "development",
  "hasApiKey": true
}
```

### Test Credits Endpoint

```bash
curl http://localhost:3000/api/clone/credits
```

Should return your current D-ID credit balance.

## Step 4: Frontend Integration

Your frontend should call the backend, never D-ID directly.

```javascript
// Example: Create AI clone
async function createClone(audioFile, imageFile) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('image', imageFile);

  const response = await fetch('http://localhost:3000/api/clone/create', {
    method: 'POST',
    body: formData
  });

  return response.json();
}
```

## Architecture Flow

```
User Browser (Frontend)
    |
    | Upload files
    v
Your Backend (Port 3000)
    |
    | Backend uses DID_API_KEY from .env
    v
D-ID API
    |
    | Returns video
    v
Your Backend
    |
    | Forward response
    v
User Browser
```

## Security Checklist

- [x] .gitignore includes .env files
- [x] API key in GitHub Secrets
- [x] Backend reads from environment variables only
- [x] No keys in frontend code
- [x] No keys committed to repository
- [ ] Regenerate exposed API key at studio.d-id.com
- [ ] Create local .env file with new key
- [ ] Add new key to GitHub Secrets

## File Structure Created

```
neuralmeet/
├── .gitignore              ✓ Ignores .env files
├── .env.example            ✓ Template without real keys
├── backend/
│   ├── config/
│   │   └── config.js       ✓ Reads from process.env
│   ├── services/
│   │   └── didService.js   ✓ D-ID API integration
│   ├── routes/
│   │   └── clone.js        ✓ API endpoints
│   ├── server.js           ✓ Express server
│   ├── package.json        ✓ Dependencies
│   └── README.md           ✓ Backend docs
└── .github/
    └── workflows/
        └── deploy.yml      ✓ Uses GitHub Secrets
```

## API Endpoints Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server health check |
| POST | /api/clone/create | Create AI video clone |
| GET | /api/clone/status/:talkId | Get generation status |
| GET | /api/clone/credits | Check D-ID credits |
| DELETE | /api/clone/:talkId | Delete a talk |

## Troubleshooting

**Server won't start**
- Check if .env file exists in backend folder
- Verify DID_API_KEY is set in .env
- Run: `node -e "console.log(process.env.DID_API_KEY)"`

**API key error**
- Regenerate key at studio.d-id.com
- Update .env file
- Update GitHub Secret
- Restart server

**CORS errors**
- Check FRONTEND_URL in .env matches your frontend
- Default is http://localhost:3000

## Next Steps

1. Regenerate API key now
2. Update .env file with new key
3. Update GitHub Secret with new key
4. Start backend server
5. Test with health endpoint
6. Integrate frontend to call backend APIs

## Production Deployment

For production on services like Railway, Render, Vercel:

1. Add environment variable: `DID_API_KEY`
2. Set `NODE_ENV=production`
3. Set `FRONTEND_URL` to your production domain
4. Deploy backend folder

The backend automatically uses environment variables regardless of platform.
