# Quick Test Guide - 2 Minutes

## Test Your New API Key

You just updated your GitHub Secret with a new API key. Let's verify it works.

## Step 1: Run GitHub Actions Test

**Click this link:**  
https://github.com/bharathk2498/neuralmeet/actions/workflows/test-api-key.yml

**Then:**
1. Click the green **"Run workflow"** dropdown button (top right)
2. Click the **"Run workflow"** button that appears
3. Wait 30 seconds
4. Click on the running workflow (blue dot)
5. Click on **"test-api-key"** job
6. Expand each step to see results

## Expected Results

**✅ Test GitHub Secret:**
```
✅ GitHub Secret configured
Key length: 59 characters
```

**✅ Test D-ID API Connection:**
```
✅ D-ID API connection successful
Credits: {
  "remaining": 12
}
```

**✅ Summary:**
```
✅ All Tests Passed
✓ GitHub Secret: Configured
✓ D-ID API: Connected
✓ Backend: Ready
```

## If Test Passes

🎉 **Success!** Your setup is perfect.

**Next steps:**
1. Create local .env file
2. Test backend locally
3. Deploy to production

**See:** [STATUS.md](STATUS.md) for detailed next steps

## If Test Fails

### Error: "DID_API_KEY not found"

**Problem:** GitHub Secret not configured

**Fix:**
1. Go to: https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
2. Verify `DID_API_KEY` exists in the list
3. If missing, click **"New repository secret"**
4. Name: `DID_API_KEY`
5. Value: Your regenerated D-ID API key
6. Click **"Add secret"**
7. Re-run the workflow

### Error: "D-ID API connection failed"

**Problem:** Invalid API key format or unauthorized

**Fix:**
1. Verify you copied the FULL key from D-ID
2. Key should be in format: `base64string:base64string`
3. Go to https://studio.d-id.com/account-settings
4. Copy the API key again (click copy icon)
5. Update GitHub Secret:
   - https://github.com/bharathk2498/neuralmeet/settings/secrets/actions
   - Click on `DID_API_KEY`
   - Click **"Update secret"**
   - Paste the full key
   - Click **"Update secret"**
6. Re-run the workflow

### Error: "npm install failed"

**Problem:** Dependencies issue

**Fix:**
1. Check if package.json exists in backend/
2. Workflow should auto-resolve on re-run
3. Re-run the workflow

## Alternative: Test Locally

If GitHub Actions has issues, test locally:

```bash
# Create .env file
cd backend
echo "DID_API_KEY=your_new_key_here" > .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env

# Install dependencies
npm install

# Test API key
node -e "
  require('dotenv').config();
  const axios = require('axios');
  axios.get('https://api.d-id.com/credits', {
    headers: { 'Authorization': 'Basic ' + process.env.DID_API_KEY }
  })
  .then(r => console.log('✅ Success:', r.data))
  .catch(e => console.log('❌ Error:', e.response?.data || e.message));
"
```

## Support

If you're still having issues:

1. Check [STATUS.md](STATUS.md) troubleshooting section
2. Review [BACKEND_SETUP_GUIDE.md](BACKEND_SETUP_GUIDE.md)
3. Open an issue: https://github.com/bharathk2498/neuralmeet/issues

## What This Test Does

1. **Checks GitHub Secret exists**
   - Verifies DID_API_KEY is configured
   - Shows key length

2. **Tests D-ID API connection**
   - Makes real API call to D-ID
   - Retrieves credit balance
   - Validates authentication

3. **Confirms setup**
   - Backend configuration valid
   - Dependencies installed
   - Ready for deployment

## After Successful Test

**Your backend is ready!**

Proceed to:
- Local development setup
- Production deployment
- Frontend integration

See [STATUS.md](STATUS.md) for complete guide.
