# NEURALMEET - TECHNICAL SETUP GUIDE

Last Updated: October 13, 2025

## OVERVIEW

Complete technical setup guide for NeuralMeet Meeting Prep MVP. This is Phase 1 only. Do not build voice or video clone yet.

---

## TECHNOLOGY STACK

### Frontend
- Bolt.new for rapid UI development
- React components
- Tailwind CSS for styling
- Deployed on Vercel

### Backend
- Supabase for database and authentication
- Supabase Storage for file uploads
- Supabase Edge Functions for serverless logic

### AI Services
- Fireflies.ai for meeting transcription
- OpenAI GPT-4 for brief generation and summary
- Emily AI for personality insights (future phase)

### Automation
- N8N for workflow automation
- Scheduled workflows for meeting processing
- Email notifications via N8N

### Payment Processing
- Stripe for subscriptions
- Webhook handling via Supabase Edge Functions

---

## PHASE 1: MEETING PREP MVP

### What We Are Building
A tool that takes meeting transcripts and generates:
- Pre-meeting briefing documents
- Key discussion points
- Historical context from past meetings
- Action items from previous sessions
- Suggested talking points

### What We Are NOT Building Yet
- Voice cloning
- Video avatar
- Live meeting attendance
- Real-time decision making

---

## STEP BY STEP SETUP

### Step 1: Domain and Hosting

1. Purchase Domain
   - Go to Namecheap or GoDaddy
   - Search for neuralmeet.com or neuralmeet.ai
   - Purchase for 1 year minimum
   - Cost: $15-20 per year

2. Set Up Vercel
   - Go to vercel.com
   - Sign up with GitHub account
   - Connect your neuralmeet repository
   - Deploy will happen automatically on every push to main branch

3. Connect Domain to Vercel
   - In Vercel dashboard, go to project settings
   - Click Domains
   - Add your purchased domain
   - Follow DNS configuration instructions
   - Add both www and root domain

### Step 2: Supabase Setup

1. Create Supabase Project
   - Go to supabase.com
   - Click New Project
   - Name: neuralmeet-production
   - Choose region closest to your users
   - Set strong database password and save it securely
   - Wait 2-3 minutes for project creation

2. Get API Credentials
   - In Supabase dashboard, go to Settings > API
   - Copy Project URL
   - Copy anon public key
   - Copy service role key (keep this secret)
   - Save these in a secure password manager

3. Set Up Environment Variables in Vercel
   - Go to Vercel project settings
   - Click Environment Variables
   - Add these variables:
     - NEXT_PUBLIC_SUPABASE_URL = your project URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY = your anon key
     - SUPABASE_SERVICE_ROLE_KEY = your service role key (for backend only)

### Step 3: Database Schema Creation

1. Open Supabase SQL Editor
   - In Supabase dashboard, click SQL Editor
   - Click New Query
   - Copy and paste the schema from DATABASE_SCHEMA.md
   - Click Run
   - Verify all tables were created under Database > Tables

2. Enable Row Level Security
   - Go to Authentication > Policies
   - For each table, enable RLS
   - Create policies as defined in DATABASE_SCHEMA.md
   - Test with sample user to ensure permissions work

3. Set Up Storage Buckets
   - Go to Storage
   - Create bucket named "meeting-files"
   - Set to private
   - Create policy to allow authenticated users to upload
   - Create policy to allow users to read only their own files

### Step 4: Fireflies.ai Integration

1. Create Fireflies Account
   - Go to fireflies.ai
   - Sign up for Business plan (required for API access)
   - Cost: $19 per user per month
   - Complete onboarding and connect your calendar

2. Get API Key
   - Go to Settings > Integrations
   - Find API section
   - Generate new API key
   - Save this key securely
   - Add to Vercel environment variables as FIREFLIES_API_KEY

3. Test API Connection
   - Use Postman or similar tool
   - Make test request to Fireflies API
   - Endpoint: https://api.fireflies.ai/graphql
   - Verify you can fetch transcripts
   - Check response structure matches documentation

### Step 5: OpenAI Setup

1. Create OpenAI Account
   - Go to platform.openai.com
   - Sign up and verify email
   - Add payment method (required for API access)
   - Set spending limit to $100 per month for safety

2. Generate API Key
   - Go to API Keys section
   - Click Create New Secret Key
   - Name it "neuralmeet-production"
   - Copy and save immediately (cannot view again)
   - Add to Vercel as OPENAI_API_KEY

3. Choose Model
   - Use GPT-4 for best quality
   - Fallback to GPT-3.5-turbo for cost savings
   - Expected cost: $0.50-2.00 per meeting brief

### Step 6: N8N Workflow Setup

1. Install N8N
   - Option A: Use N8N Cloud (easiest)
     - Go to n8n.cloud
     - Sign up for Starter plan ($20/month)
     - No installation needed
   
   - Option B: Self-host (for cost savings)
     - Use Railway.app or DigitalOcean
     - Deploy using their one-click template
     - Cost: $5-10 per month

2. Create Meeting Processing Workflow
   - Log into N8N
   - Create new workflow named "Process New Meeting"
   - Add trigger: Webhook (Supabase will call this)
   - Add node: HTTP Request to Fireflies API
   - Add node: HTTP Request to OpenAI
   - Add node: Supabase Insert (save processed brief)
   - Add node: Email notification
   - Save and activate workflow

3. Connect to Supabase
   - Copy N8N webhook URL
   - In Supabase, create database trigger
   - When new row inserted in meetings table
   - Call N8N webhook with meeting ID
   - N8N will process automatically

### Step 7: Stripe Payment Setup

1. Create Stripe Account
   - Go to stripe.com
   - Sign up and complete business verification
   - This can take 1-2 days for approval
   - Enable test mode for development

2. Create Products and Pricing
   - In Stripe dashboard, go to Products
   - Create product: "NeuralMeet Solopreneur"
     - Price: $149 per month
     - Recurring billing
   - Create product: "NeuralMeet Executive"
     - Price: $499 per month
     - Recurring billing
   - Create product: "NeuralMeet Enterprise"
     - Price: $999 per month
     - Recurring billing

3. Get API Keys
   - Go to Developers > API Keys
   - Copy Publishable key (safe to expose)
   - Copy Secret key (keep secure)
   - Add both to Vercel environment variables
     - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
     - STRIPE_SECRET_KEY

4. Set Up Webhook
   - In Stripe, go to Developers > Webhooks
   - Add endpoint: https://yourapp.com/api/stripe-webhook
   - Select events: customer.subscription.created, customer.subscription.deleted
   - Get webhook signing secret
   - Add to Vercel as STRIPE_WEBHOOK_SECRET

### Step 8: Email Configuration

1. Choose Email Service
   - Option A: SendGrid (recommended)
     - Free tier: 100 emails per day
     - Go to sendgrid.com
     - Sign up and verify domain
     - Cost: Free for MVP
   
   - Option B: Resend (simpler)
     - Free tier: 100 emails per day
     - Go to resend.com
     - Sign up with GitHub
     - Easier setup than SendGrid

2. Get API Key and Configure
   - Generate API key in your chosen service
   - Add to Vercel as EMAIL_API_KEY
   - Set up sender email address (noreply@neuralmeet.com)
   - Verify domain to avoid spam folder

3. Create Email Templates
   - Welcome email
   - Meeting brief ready notification
   - Weekly summary
   - Billing receipts
   - Store templates in database or use service's template feature

---

## DEVELOPMENT WORKFLOW

### Local Development

1. Clone Repository
   ```
   git clone https://github.com/bharathk2498/neuralmeet.git
   cd neuralmeet
   ```

2. Install Dependencies
   ```
   npm install
   ```

3. Set Up Local Environment
   - Create .env.local file
   - Copy all environment variables from Vercel
   - Never commit this file to git
   - Add .env.local to .gitignore

4. Run Development Server
   ```
   npm run dev
   ```
   - Open http://localhost:3000
   - Changes auto-reload
   - Check console for errors

### Deployment Process

1. Development Branch
   - Make changes on feature branches
   - Test locally first
   - Commit with clear messages

2. Push to GitHub
   ```
   git add .
   git commit -m "Add meeting brief generation"
   git push origin main
   ```

3. Automatic Deployment
   - Vercel detects push automatically
   - Builds and deploys in 2-3 minutes
   - Check deployment status in Vercel dashboard
   - Test live site after deployment

4. Rollback if Needed
   - In Vercel dashboard, go to Deployments
   - Find previous working deployment
   - Click three dots > Promote to Production

---

## TESTING

### Manual Testing Checklist

1. User Registration
   - Sign up with email
   - Verify email confirmation works
   - Log in successfully
   - Password reset flow

2. Meeting Upload
   - Upload meeting recording or transcript
   - Check file appears in Supabase Storage
   - Verify webhook triggered
   - Confirm N8N workflow runs

3. Brief Generation
   - Wait for processing to complete
   - Check brief appears in dashboard
   - Verify all sections are present
   - Test brief is readable and useful

4. Payment Flow
   - Go to pricing page
   - Click subscribe
   - Enter test credit card (Stripe provides test cards)
   - Verify subscription created in Stripe
   - Check user upgraded in database

### Automated Testing Setup

1. Use Vercel's built-in checks
   - Automatic build verification
   - Basic health checks
   - SSL certificate validation

2. Set Up Monitoring
   - Add Sentry for error tracking
   - Free tier available
   - Get notified of production errors
   - Track user issues

---

## SECURITY CHECKLIST

- All API keys stored in environment variables (never in code)
- Database Row Level Security enabled
- HTTPS enforced on all pages
- Input validation on all forms
- SQL injection prevention (using Supabase prevents this)
- Rate limiting on API endpoints
- User passwords hashed (Supabase handles this)
- Regular dependency updates

---

## COST BREAKDOWN (MONTHLY)

### Required Services
- Domain: $1.25
- Vercel Pro: $20
- Supabase Pro: $25
- Fireflies.ai: $19
- N8N Cloud: $20
- SendGrid: $0 (free tier sufficient for start)
- Stripe: $0 (only pay per transaction)
- OpenAI: $50-100 (variable based on usage)

Total: Approximately $135-155 per month

### Cost Optimization
- Start with free tiers where possible
- Upgrade only when hitting limits
- Monitor OpenAI usage closely
- Use GPT-3.5 instead of GPT-4 if cost becomes issue

---

## TROUBLESHOOTING

### Common Issues

1. Environment Variables Not Working
   - Redeploy after adding new variables
   - Check variable names match exactly (including case)
   - Ensure NEXT_PUBLIC_ prefix for client-side variables

2. Supabase Connection Fails
   - Verify API URL and keys are correct
   - Check if RLS policies are blocking requests
   - Test with service role key to bypass RLS temporarily
   - Review Supabase logs for specific error

3. Fireflies API Returns Error
   - Confirm API key is valid
   - Check if you have active subscription
   - Verify meeting ID exists in Fireflies
   - Review API rate limits

4. N8N Workflow Not Triggering
   - Check webhook URL is correct
   - Verify Supabase trigger is active
   - Test webhook manually with Postman
   - Review N8N execution logs

5. Payments Not Processing
   - Verify Stripe keys match environment (test vs live)
   - Check webhook is receiving events
   - Review Stripe dashboard for failed payments
   - Test with Stripe's test card numbers first

---

## NEXT STEPS AFTER SETUP

1. Deploy landing page to production domain
2. Set up Google Analytics tracking
3. Create first test user account
4. Upload test meeting transcript
5. Verify entire flow works end to end
6. Invite first beta user
7. Create feedback collection form
8. Document any setup issues you encountered

---

## SUPPORT RESOURCES

- Vercel Documentation: vercel.com/docs
- Supabase Documentation: supabase.com/docs
- Fireflies API Docs: docs.fireflies.ai
- N8N Documentation: docs.n8n.io
- OpenAI API Reference: platform.openai.com/docs
- Stripe Integration Guide: stripe.com/docs

---

This setup should take 4-6 hours to complete if following step by step. Do not skip steps or rush through security configuration.
