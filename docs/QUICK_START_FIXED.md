# Quick Start Guide - After Applying Fixes

## Prerequisites

- Node.js 18+
- Git repository cloned
- Supabase project created
- QStash/Upstash account
- Anthropic API key
- Stripe account

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Tokens (5 min)

#### Supabase
- Go to https://app.supabase.com → Your Project → Settings → API
- Copy: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy: `SUPABASE_SERVICE_ROLE_KEY` (Service Role Key tab)

#### Anthropic
- Go to https://console.anthropic.com → API Keys
- Create new key, copy it

#### Upstash QStash (⚠️ CRITICAL - Don't Mix These Up)
- Go to https://console.upstash.com → QStash
- Find "Default token" → Copy to `QSTASH_TOKEN` (THIS IS FOR PUBLISHING)
- Go to "Signing Keys" → Copy "Current Key" to `QSTASH_CURRENT_SIGNING_KEY`

#### Stripe
- Go to https://dashboard.stripe.com → Developers → API Keys
- Copy: `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (Publishable Key)
- Copy: `STRIPE_SECRET_KEY` (Secret Key)

### 3. Create .env.local
```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local and paste all your tokens
# CRITICAL: QSTASH_TOKEN ≠ QSTASH_CURRENT_SIGNING_KEY
```

### 4. Setup Database
```bash
# Run migrations
npx supabase db push

# (Optional) Seed demo data
npm run seed
```

### 5. Start Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Test Upload Flow
```bash
# In another terminal:
# 1. Get your JWT token from browser DevTools → Application → Cookies
# 2. Test upload:

curl -X POST http://localhost:3000/api/documents/upload \\
  -F "file=@sample.pdf" \\
  -F "siteId=test-site-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return 202 with documentId
```

### 7. Verify Processing
```bash
# Check QStash dashboard:
# https://console.upstash.com → QStash → Messages
# Should see your published message

# After ~5 seconds, webhook should be called
# Document status should change: processing → processed
```

## What Works Now

✅ **File Upload** → Returns 202 (Async)  
✅ **QStash Queue** → Correct payload  
✅ **PDF Processing** → Extract text  
✅ **Claude Analysis** → Generate risk score  
✅ **Database Update** → Status changes  
✅ **Logo Display** → No more 404  

## Common Mistakes to Avoid

❌ Don't put signing key in `QSTASH_TOKEN`  
→ Use the **publish token** from "Default token"

❌ Don't forget `QSTASH_CURRENT_SIGNING_KEY`  
→ Copy from "Signing Keys" → "Current Key"

❌ Don't use `logo.jpg`  
→ Use `logo.png`

❌ Don't forget to rebuild after env changes  
→ `rm -rf .next && npm run dev`

## Troubleshooting

### Upload returns 401
```
Problem: Wrong QSTASH_TOKEN
Solution: Use publish token, not signing key
Location: Upstash Console → QStash → Default token
```

### Document stuck "processing"
```
Problem: Wrong QSTASH_CURRENT_SIGNING_KEY
Solution: Copy from Signing Keys → Current Key
Location: Upstash Console → QStash → Signing Keys
```

### Logo shows 404
```
Problem: logo.png doesn't exist
Solution: 
1. Check: ls public/logo.png
2. Clear cache: rm -rf .next
3. Rebuild: npm run dev
```

## Production Deployment
```bash
# 1. Build locally to test
npm run build

# 2. Push to GitHub
git add .
git commit -m "Apply QStash and logo fixes"
git push

# 3. Go to Vercel dashboard
# 4. Add environment variables (copy from .env.local)
# 5. Update NEXT_PUBLIC_APP_URL to your domain
# 6. Update PROCESS_DOCUMENT_URL to your domain
# 7. Deploy

# 8. Test production upload
curl -X POST https://your-domain.com/api/documents/upload \\
  -F "file=@sample.pdf" \\
  -F "siteId=test-site-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

1. ✅ Follow this guide
2. ✅ Test upload locally
3. ✅ Verify processing works
4. ✅ Deploy to production
5. ✅ Test production upload
6. 📚 Read `/docs/API.md` for full API reference
7. 📚 Read `/docs/FRONTEND_INTEGRATION.md` for component docs
