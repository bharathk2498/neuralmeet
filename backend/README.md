# NeuralMeet Backend

Secure backend API for D-ID integration.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create Environment File

Create a `.env` file in the backend directory:

```bash
DID_API_KEY=YmhhcmF0aGs5MzM5QGdtYWlsLmNvbQ:zWYAra20UOvpw-tvt5mxm
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Run Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Create AI Clone
```
POST /api/clone/create
Content-Type: multipart/form-data

Fields:
- audio: Audio file (MP3, WAV, M4A, MOV)
- image: Image file (JPG, PNG)
```

### Get Clone Status
```
GET /api/clone/status/:talkId
```

### Get Credits
```
GET /api/clone/credits
```

### Delete Clone
```
DELETE /api/clone/:talkId
```

## Security

- API key stored in environment variables only
- Never commit .env file to Git
- Use GitHub Secrets for deployment
- CORS configured for frontend URL only

## GitHub Secrets Setup

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Add secret: `DID_API_KEY`
4. Value: Your D-ID API key

## Testing

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Test clone creation:

```bash
curl -X POST http://localhost:3000/api/clone/create \
  -F "audio=@/path/to/audio.mp3" \
  -F "image=@/path/to/image.jpg"
```