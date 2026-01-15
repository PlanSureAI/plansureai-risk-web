# PlanSureAI Deployment Guide

## Prerequisites

- Node.js 18+
- Git
- GitHub account
- Vercel account (for hosting)
- Supabase project (for database)
- Stripe account (for payments)
- Anthropic API key (for Claude)

## Deployment Steps

### 1. Prepare the Repository
```bash
# Clone the repository
git clone https://github.com/PlanSureAI/plansureai-risk-web.git
cd plansureai-risk-web

# Install dependencies
npm install

# Build the project
npm run build

# Test the build locally
npm run dev
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-key

# Stripe
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# QStash (Upstash)
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Deploy Database Migrations
```bash
# Connect to Supabase
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Seed data (optional)
npm run seed
```

### 4. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --env-file .env.local

# Promote to production
vercel --prod
```

#### Option B: Using GitHub Integration

1. Push to GitHub
2. Go to https://vercel.com/new
3. Import the GitHub repository
4. Add environment variables from `.env.local`
5. Click "Deploy"
6. Vercel will automatically deploy on future pushes

### 5. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add a new endpoint: `https://your-domain.com/api/stripe/webhooks`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Update `STRIPE_WEBHOOK_SECRET` in environment variables

### 6. Configure QStash Webhooks

1. Go to Upstash Console → QStash
2. Configure publishing endpoint: `https://your-domain.com/api/documents/process`
3. Set signing key in environment variables

### 7. Test Deployment
```bash
# Test all endpoints
curl https://your-domain.com/api/health

# Test authentication
# Go to https://your-domain.com/login and sign up

# Test document upload
# Upload a sample PDF through the UI

# Test Stripe webhook
# Use Stripe's webhook testing tool
```

### 8. Production Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] SSL certificate active
- [ ] Stripe webhooks configured
- [ ] QStash webhooks configured
- [ ] Email service configured (SendGrid/Resend)
- [ ] Error monitoring set up (Sentry)
- [ ] Performance monitoring active (Vercel Analytics)
- [ ] Backups configured
- [ ] Domain configured with custom DNS (if applicable)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Monitoring

### Vercel Analytics
```bash
# View deployments
vercel list

# View logs
vercel logs

# View analytics
# Go to https://vercel.com/dashboard
```

### Error Tracking (Optional: Sentry)
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
# See Sentry documentation
```

### Database Monitoring
```bash
# Check Supabase logs
# Go to Supabase Dashboard → Logs
```

## Scaling

### If You Get High Traffic

1. **Enable Edge Functions** in Vercel settings
2. **Increase database size** in Supabase
3. **Use CDN** for static assets (Vercel handles this automatically)
4. **Implement caching** with Redis (optional)
5. **Monitor rate limits** on all APIs

### Cost Optimization

- Supabase: Free tier includes 500MB database, scale as needed
- Vercel: Free tier includes 100 deployments/month, scales automatically
- Stripe: 2.9% + 30p per transaction
- Anthropic: Pay per API request (~$0.003 per request)

## Troubleshooting

### Build Failures
```bash
# Clear dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Database Connection Issues
```bash
# Test connection
npm run test:db

# Check Supabase status
# Go to status.supabase.com
```

### API Errors
```bash
# Check logs
vercel logs --follow

# Check error tracking
# Go to error monitoring dashboard
```

## Rollback
```bash
# Revert to previous deployment
vercel rollback

# Or manually redeploy from GitHub
git revert HEAD
git push
```

## Updates & Maintenance
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Run tests before deploying
npm test

# Deploy
git push
```

## Support

- Documentation: `/docs`
- API Reference: `/docs/API.md`
- Frontend Guide: `/docs/FRONTEND_INTEGRATION.md`
- GitHub Issues: https://github.com/PlanSureAI/plansureai-risk-web/issues
