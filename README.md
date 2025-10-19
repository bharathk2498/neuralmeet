# NeuralMeet - AI Meeting Clone System

Create AI-powered video clones that attend meetings on your behalf using D-ID technology.

## Quick Start

### 1. GitHub Secret is Configured

Your `DID_API_KEY` is securely stored in GitHub Secrets.

### 2. Test Backend with GitHub Actions

Go to Actions tab and run "Test Backend with GitHub Secret":

https://github.com/bharathk2498/neuralmeet/actions

This validates:
- GitHub Secret configuration
- D-ID API connection
- Backend endpoints
- Credit balance

### 3. Local Development

```bash
cd backend
touch .env
```

Add to .env:
```
DID_API_KEY=your_regenerated_key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Install and run:
```bash
npm install
npm start
```

Test:
```bash
curl http://localhost:3000/health
```

### 4. Deploy to Production

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Render.com deployment
- Railway deployment  
- Vercel deployment
- GitHub Codespaces

## Architecture

```
Frontend (HTML/JS)
    ↓
Backend API (Express)
    ↓ Uses GitHub Secret
D-ID API
    ↓
AI Video Generation
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Server health check |
| /api/clone/create | POST | Create AI clone |
| /api/clone/status/:id | GET | Check generation status |
| /api/clone/credits | GET | View credit balance |
| /api/clone/:id | DELETE | Delete video |

## Features

- AI video clone generation
- Voice training from audio samples
- Secure API key management
- GitHub Actions integration
- Production deployment ready
- CORS configured
- Error handling
- File upload support

## Documentation

- [Backend Setup Guide](BACKEND_SETUP_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Security Incident Response](SECURITY_INCIDENT_RESPONSE.md)
- [Quick Start](QUICK_START.md)

## Tech Stack

**Backend:**
- Node.js + Express
- Multer for file uploads
- Axios for API calls
- CORS for security

**Frontend:**
- Vanilla JavaScript
- HTML5
- Fetch API

**Infrastructure:**
- GitHub Actions
- GitHub Secrets
- GitHub Pages
- D-ID API

## Security

- API key in GitHub Secrets only
- Environment variables for configuration
- .gitignore protects .env files
- No secrets in code or commits
- CORS restricts backend access
- GitHub Actions for secure CI/CD

## Getting Started

1. API key is in GitHub Secrets ✓
2. Run test workflow to validate ✓
3. Create local .env for development
4. Deploy to production platform
5. Update frontend with backend URL
6. Test clone creation

## Support

Issues: https://github.com/bharathk2498/neuralmeet/issues

D-ID Support: support@d-id.com

## License

MIT
