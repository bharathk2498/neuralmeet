# Quick Start - 3 Steps

## Step 1: Add API Key to GitHub Secrets

**This is required for GitHub Actions and production deployments.**

1. Go to: https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
2. Click **New repository secret**
3. Name: `DID_API_KEY`
4. Value: `YmhhcmF0aGs5MzM5QGdtYWlsLmNvbQ:zWYAra20UOvpw-tvt5mxm`
5. Click **Add secret**

## Step 2: Run Setup Script

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
setup.bat
```

## Step 3: Test Backend

Open browser or use curl:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "hasApiKey": true
}
```

## Your Backend is Ready

**Available Endpoints:**
- POST http://localhost:3000/api/clone/create
- GET http://localhost:3000/api/clone/status/:id
- GET http://localhost:3000/api/clone/credits

**Test Credit Balance:**
```bash
curl http://localhost:3000/api/clone/credits
```

## Frontend Integration

Update your dashboard.html:

```javascript
const BACKEND_URL = 'http://localhost:3000';

async function createClone(audioFile, imageFile) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('image', imageFile);

  const response = await fetch(`${BACKEND_URL}/api/clone/create`, {
    method: 'POST',
    body: formData
  });

  return response.json();
}
```

## Troubleshooting

**Port already in use:**
```bash
kill -9 $(lsof -ti:3000)
```

**Dependencies error:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**API key error:**
Check backend/.env file exists and contains:
```
DID_API_KEY=YmhhcmF0aGs5MzM5QGdtYWlsLmNvbQ:zWYAra20UOvpw-tvt5mxm
```
