# Local Setup Instructions

## SECURITY WARNING

Your API key was briefly exposed in the repository. You must regenerate it.

## Step 1: Regenerate API Key (REQUIRED)

1. Go to: https://studio.d-id.com/account-settings
2. Scroll to API Key section
3. Click the regenerate or create new key button
4. Copy your NEW key

## Step 2: Create Local .env File

The .env file should ONLY exist on your local machine, never in Git.

```bash
cd backend
touch .env
```

Add this content with your NEW key:

```
DID_API_KEY=your_new_key_here
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Step 3: Add Key to GitHub Secrets

For production deployments:

1. Visit: https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
2. Click "New repository secret"
3. Name: `DID_API_KEY`
4. Value: Your NEW regenerated key
5. Click "Add secret"

## Step 4: Install and Run

```bash
cd backend
npm install
npm start
```

## Step 5: Verify

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "hasApiKey": true
}
```

## Why .env Files Must Never Be Committed

- Exposing API keys allows anyone to use your credits
- Keys in Git history are permanently accessible
- Automated bots scan GitHub for exposed credentials
- Your account can be compromised within hours
- D-ID may ban accounts for security violations

## Correct Setup Flow

```
Local Development:
  .env file (local only) → Backend reads key → D-ID API

Production:
  GitHub Secrets → Environment Variables → Backend reads key → D-ID API
```

## Never Commit These Files

- .env
- .env.local
- .env.production
- Any file containing API keys or passwords
- Database connection strings
- Private keys or certificates

## Always Use

- .gitignore to block sensitive files
- Environment variables for configuration
- GitHub Secrets for CI/CD
- Separate keys for dev/staging/production

## Troubleshooting

**Backend says API key missing:**
- Check backend/.env file exists
- Verify DID_API_KEY is set in .env
- Restart the backend server

**Still using old exposed key:**
- Generate new key at studio.d-id.com
- Update backend/.env with new key
- Update GitHub Secrets with new key
- Delete and restart any running processes

The .gitignore file has been updated to block all .env files going forward.
