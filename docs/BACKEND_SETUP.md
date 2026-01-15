# PlanSureAI Backend - Complete Setup Guide

## 🎯 Overview

This backend provides:
- ✅ Async document processing with PDF extraction
- ✅ AI-powered risk scoring using Claude
- ✅ Planning approvals mapping
- ✅ Portfolio metrics aggregation
- ✅ Shareable analysis links
- ✅ Pre-app pack generation
- ✅ Email alert subscriptions
- ✅ Stripe payment integration

## 📋 Quick Start (10 minutes)

### 1. Clone & Install
```bash
git clone https://github.com/PlanSureAI/plansureai-risk-web
cd plansureai-risk-web
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in all variables from /.env.example
```

### 3. Database Setup
```bash
# Apply migrations
supabase db push

# Seed test data
npm run seed
```

### 4. Start Development
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔧 Architecture

### API Routes Structure
```
/app/api/
├── documents/
│   └── process/          # Async PDF processing
├── risk/
│   └── calculate/        # Risk score calculation
├── approvals/
│   └── nearby/           # Comparable approvals
├── portfolio/
│   └── metrics/          # Portfolio metrics
├── shares/
│   └── create/           # Share links
├── preapp/
│   └── generate-pack/    # Pre-app pack generator
├── alerts/
│   └── schedule/         # Email alerts
└── stripe/
    └── webhooks/         # Payment webhooks
```

### Data Flow
```
PDF Upload
  ↓
QStash Webhook
  ↓
Document Processor
  ├→ Extract Text
  ├→ Generate Embeddings
  ├→ Calculate Risk Score (Claude)
  └→ Update Site
  
Risk Score
  ↓
Portfolio Metrics
  ↓
Comparable Approvals
  ↓
Shareable Link
```

---

## 🚀 Deployment (Production)

### 1. Vercel Setup
```bash
# Link to Vercel
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other variables
```

### 2. Database (Supabase)
- Ensure migrations are applied
- Verify pgvector extension is enabled
- Check RLS policies are in place

### 3. Deploy
```bash
npm run build
vercel deploy --prod
```

### 4. Verify Deployment
```bash
# Test API endpoints
curl https://plansureai.com/api/portfolio/metrics?userId=test

# Check logs
vercel logs
```

---

## 📊 API Reference

### Creating a Complete Workflow

1. **User uploads planning document**
```bash
   POST /upload with file
   → Gets document ID and file URL
```

2. **Trigger async processing**
```bash
   POST /api/documents/process (via QStash)
   {
     "documentId": "...",
     "fileUrl": "...",
     "siteId": "...",
     "userId": "..."
   }
```

3. **Get risk score**
```bash
   POST /api/risk/calculate
   {
     "siteId": "..."
   }
   → Returns risk assessment
```

4. **View portfolio**
```bash
   GET /api/portfolio/metrics?userId=...
   → Returns aggregated metrics
```

5. **Get comparable approvals**
```bash
   GET /api/approvals/nearby?siteId=...&radiusKm=0.5
   → Returns nearby approved applications
```

6. **Create share link**
```bash
   POST /api/shares/create
   {
     "siteId": "...",
     "expiresInDays": 30
   }
   → Returns shareable URL
```

7. **Generate pre-app pack**
```bash
   POST /api/preapp/generate-pack
   {
     "siteId": "..."
   }
   → Returns pack content
```

---

## 🔐 Security Considerations

- [ ] All endpoints require authentication (except public shares)
- [ ] RLS policies enforce user access control
- [ ] QStash webhooks are signature-verified
- [ ] Stripe webhooks are signature-verified
- [ ] PDF extraction sanitizes all input
- [ ] Rate limiting is implemented per plan tier

---

## 🐛 Troubleshooting

### Document Processing Fails
- Check QStash webhook signing key
- Verify PDF is valid and not corrupted
- Check Supabase storage permissions

### Risk Score Missing
- Ensure Claude API key is valid
- Check document has extracted text
- Verify site has planning constraints

### Portfolio Metrics Showing Zero
- Ensure user_id is correct
- Verify sites exist in database
- Check user owns sites (RLS)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Stripe API Reference](https://stripe.com/docs/api)
- [QStash Documentation](https://upstash.com/docs/qstash)
