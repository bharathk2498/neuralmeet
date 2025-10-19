# Quick Start - 3 Steps

## Step 1: Regenerate Your API Key First

**CRITICAL: Your API key was exposed in this repository.**

1. Go to: https://studio.d-id.com/account-settings
2. Click **Regenerate API Key** or **Create New Key**
3. Copy your NEW key

## Step 2: Add New API Key to GitHub Secrets

**For production deployments:**

1. Go to: https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
2. Click **New repository secret**
3. Name: `DID_API_KEY`
4. Value: Paste your NEW regenerated key
5. Click **Add secret**

## Step 3: Create Local .env File

**For local development:**

```bash
cd backend
touch .env
```

Add this content with your NEW key:

```
DID_API_KEY=paste_your_new_key_here
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Step 4: Run Setup Script

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
setup.bat
```

## Step 5: Test Backend

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

## Security Reminder

- Never commit .env files
- Never share API keys in chat or code
- Rotate keys immediately if exposed
- Use GitHub Secrets for production
- Keep separate keys for dev/staging/prod

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
Ensure backend/.env file exists with your NEW regenerated key.
