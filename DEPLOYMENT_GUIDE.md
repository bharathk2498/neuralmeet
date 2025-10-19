# Deployment Guide - Using GitHub Secret

## GitHub Secret is Now Configured

Your `DID_API_KEY` is securely stored in GitHub Secrets and ready to use.

## Quick Test - GitHub Actions

The backend test workflow runs automatically on every push. You can also trigger it manually:

1. Go to: https://github.com/bharathk2498/neuralmeet/actions
2. Click "Test Backend with GitHub Secret"
3. Click "Run workflow"
4. Click "Run workflow" button

This will:
- Verify your GitHub Secret is configured
- Test D-ID API connection
- Start backend server
- Test all endpoints
- Show your credit balance

## Deployment Options

### Option 1: Local Development

**Create backend/.env file:**

```bash
cd backend
touch .env
```

**Add your key:**
```
DID_API_KEY=your_regenerated_key_here
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Run:**
```bash
npm install
npm start
```

### Option 2: Deploy to Render.com

**Free tier with GitHub Secret integration:**

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub: bharathk2498/neuralmeet
4. Configure:
   - Name: `neuralmeet-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Add Environment Variable:
     - Key: `DID_API_KEY`
     - Value: Your regenerated key
5. Click "Create Web Service"

**Your backend will be live at:**
`https://neuralmeet-backend.onrender.com`

### Option 3: Deploy to Railway.app

**Free $5 credit monthly:**

1. Go to: https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose: bharathk2498/neuralmeet
5. Configure:
   - Root Directory: `backend`
   - Add Variable: `DID_API_KEY` = your key
6. Deploy

**Your backend will be live at:**
`https://neuralmeet-backend.railway.app`

### Option 4: Deploy to Vercel

**Serverless deployment:**

```bash
npm install -g vercel
cd backend
vercel
```

When prompted:
- Link to project: Yes
- Add environment variable: `DID_API_KEY`

**Your backend will be live at:**
`https://neuralmeet-backend.vercel.app`

### Option 5: GitHub Codespaces

**Run backend directly in browser:**

1. Go to: https://github.com/bharathk2498/neuralmeet
2. Click "Code" → "Codespaces" → "Create codespace"
3. In terminal:
   ```bash
   cd backend
   echo "DID_API_KEY=${{ secrets.DID_API_KEY }}" > .env
   npm install
   npm start
   ```

**Access at:**
Codespaces will auto-forward port 3000

## Frontend Configuration

### For Local Development

Update your frontend files to point to localhost:

```javascript
const BACKEND_URL = 'http://localhost:3000';
```

### For Production

Update frontend to point to your deployed backend:

```javascript
const BACKEND_URL = 'https://neuralmeet-backend.onrender.com';
```

## Testing Your Deployment

### Test Health Endpoint

```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T...",
  "environment": "production",
  "hasApiKey": true
}
```

### Test Credits Endpoint

```bash
curl https://your-backend-url.com/api/clone/credits
```

Expected response:
```json
{
  "success": true,
  "data": {
    "remaining": 12
  }
}
```

### Test Clone Creation

```bash
curl -X POST https://your-backend-url.com/api/clone/create \
  -F "audio=@audio.mp3" \
  -F "image=@photo.jpg"
```

## Environment Variables Needed

**Required:**
- `DID_API_KEY` - Your D-ID API key

**Optional:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - CORS origin (your frontend URL)

## GitHub Actions Integration

Your workflows automatically use the GitHub Secret:

**Test Workflow:**
- Runs on every push
- Tests backend with secret
- Validates D-ID connection
- Shows test results

**Deploy Workflow:**
- Deploys frontend to GitHub Pages
- Configures backend URL
- Sets up production environment

## Monitoring

### Check GitHub Actions

View test results:
https://github.com/bharathk2498/neuralmeet/actions

### Check D-ID Usage

Monitor credits and usage:
https://studio.d-id.com

### Check Backend Logs

**Render.com:**
Logs tab in dashboard

**Railway:**
Deployments → View Logs

**Vercel:**
Deployments → Function Logs

## Troubleshooting

**GitHub Actions failing:**
- Check: https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
- Verify `DID_API_KEY` exists
- Regenerate key if needed

**Backend not starting:**
```bash
cd backend
node -e "console.log(require('./config/config'))"
```

**API key not loading:**
```bash
echo $DID_API_KEY
node -e "console.log(process.env.DID_API_KEY)"
```

**CORS errors:**
Update `FRONTEND_URL` environment variable to match your frontend domain

## Security Checklist

- [x] API key in GitHub Secrets
- [x] .env in .gitignore
- [x] No keys in code
- [x] GitHub Actions using secret
- [ ] Deploy to production platform
- [ ] Set FRONTEND_URL for CORS
- [ ] Enable HTTPS
- [ ] Monitor usage

## Next Steps

1. Choose deployment platform (Render recommended)
2. Deploy backend with GitHub Secret
3. Update frontend with backend URL
4. Test all endpoints
5. Monitor D-ID usage
6. Set up alerts for credit depletion

## Platform Comparison

| Platform | Free Tier | Deploy Time | Best For |
|----------|-----------|-------------|----------|
| Render | 750 hours/month | 5 min | Production |
| Railway | $5/month credit | 2 min | Quick deploy |
| Vercel | Unlimited | 1 min | Serverless |
| Codespaces | 60 hours/month | Instant | Development |

**Recommended:** Render.com for production deployment

Your GitHub Secret is ready. Choose a platform and deploy!
