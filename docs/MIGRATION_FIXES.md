# PlanSureAI Fix & Migration Guide

## What Was Fixed

### 1. Document Upload/Process Pipeline Alignment ✅

**Problem**: 
- `/api/documents/upload` was publishing `{ jobId }` 
- `/api/documents/process` expected `{ documentId, fileUrl, siteId, userId }`
- This caused 500 errors and documents stuck in "processing" status

**Solution**:
- Updated upload route to publish correct payload: `{ documentId, fileUrl, siteId, userId, fileName, pdfText }`
- Process route now expects and uses this payload
- Documents now flow correctly through processing pipeline

### 2. QStash Token Configuration ✅

**Problem**:
- Easy to confuse publish token with signing key
- 401 errors from wrong token in wrong place
- No clear documentation of which token goes where

**Solution**:
- Created comprehensive QStash setup guide
- Clear env template showing both tokens
- Error messages explain which token is wrong

### 3. Logo File References ✅

**Problem**:
- Components referencing `logo.jpg` but only `logo.png` exists
- 404 errors in console

**Solution**:
- Updated Navbar & Sidebar to use `logo.png`
- Using Next.js Image component for optimization

## Implementation Steps

### Step 1: Update API Routes

Replace these files with the corrected versions:

1. **Replace `/app/api/documents/upload/route.ts`** with FILE 37 (Corrected Upload Route)
   - Now publishes complete payload to QStash
   - Sets document status to "processing"
   - Returns 202 (Accepted) for async processing

2. **Replace `/app/api/documents/process/route.ts`** with FILE 38 (Corrected Process Route)
   - Expects correct payload from QStash
   - Verifies QStash signature properly
   - Updates document status from "processing" to "processed"
   - Updates site risk score from Claude analysis

### Step 2: Update Environment Configuration

1. **Replace `.env.example`** with FILE 39 (Updated Environment Template)
   - Clear documentation of each token
   - Explains which is publish vs signing key
   - Setup instructions for each service

2. **Update your `.env.local`**:
```bash
   # Copy from .env.example and fill in actual values
   
   # CRITICAL: Get these from correct places
   QSTASH_TOKEN=<publish token from Upstash console>
   QSTASH_CURRENT_SIGNING_KEY=<signing key from QStash → Signing Keys>
```

### Step 3: Update Component Files

1. **Replace `/app/components/Navbar.tsx`** with FILE 41
   - Uses `logo.png` instead of `logo.jpg`
   - Uses Next.js Image component
   - No more 404 errors for logo

2. **Replace `/app/components/Sidebar.tsx`** with FILE 42
   - Uses `logo.png` instead of `logo.jpg`
   - Uses Next.js Image component
   - Consistent with Navbar

### Step 4: Verify File Structure

Ensure you have these asset files:
```
/public
├── logo.png          ← Make sure this exists
└── (other assets)
```

If you don't have `logo.png`:
- Use your logo file
- Make sure it's named `logo.png`
- Place it in `/public` directory
- Recommended: 128x128 or 256x256 PNG file

### Step 5: Clear Build Cache
```bash
# Remove build artifacts
rm -rf .next

# Reinstall dependencies to ensure clean state
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Step 6: Test Locally
```bash
# Start dev server
npm run dev

# In another terminal, test upload:
curl -X POST http://localhost:3000/api/documents/upload \\
  -F "file=@sample.pdf" \\
  -F "siteId=test-site-id" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "documentId": "doc-uuid",
  "message": "File uploaded successfully and queued for processing"
}
```

### Step 7: Verify Database Changes

Run these SQL checks in Supabase:
```sql
-- Check document was created with correct status
SELECT id, status, file_name, created_at 
FROM documents 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show: status = "processing"

-- After ~5 seconds, status should change to "processed"
SELECT id, status, processed_at, risk_factors 
FROM documents 
ORDER BY created_at DESC 
LIMIT 1;

-- Check site risk score was updated
SELECT id, risk_score, risk_factors, documents_count
FROM sites
WHERE id = 'your-test-site-id';
```

## Complete Testing Checklist

### Pre-Deployment Testing

- [ ] **Environment Variables Set**
  - [ ] `QSTASH_TOKEN` is the publish token (not signing key)
  - [ ] `QSTASH_CURRENT_SIGNING_KEY` is the signing key
  - [ ] `PROCESS_DOCUMENT_URL` points to correct endpoint
  - [ ] All env vars loaded: `npm run dev` and check console

- [ ] **Upload Endpoint (202 Response)**
  - [ ] POST to `/api/documents/upload` with PDF file
  - [ ] Returns 202 (Accepted) not 200
  - [ ] Returns `documentId` in response
  - [ ] Document created in database with status "processing"

- [ ] **QStash Publishing (No 401)**
  - [ ] No "401 Unauthorized" errors in logs
  - [ ] Check Upstash dashboard → Messages tab
  - [ ] See published message in QStash logs

- [ ] **Processing Webhook (Signature Verification)**
  - [ ] QStash calls webhook after ~1-5 seconds
  - [ ] Signature verification passes (no 401 on webhook)
  - [ ] Document status changes to "processed"
  - [ ] Risk factors extracted and stored
  - [ ] Site risk_score updated

- [ ] **Claude Integration**
  - [ ] Claude API key is valid
  - [ ] Risk analysis completes without errors
  - [ ] Risk factors stored in document
  - [ ] Risk score calculated correctly (0-100)

- [ ] **Logo Display**
  - [ ] Logo displays in sidebar (no 404)
  - [ ] Logo displays in navbar (no 404)
  - [ ] Images load without console errors

- [ ] **Database Operations**
  - [ ] Documents table has new records
  - [ ] Status field changes "processing" → "processed"
  - [ ] Sites table risk_score updated correctly
  - [ ] No database constraint violations

### Error Scenarios

Test these to ensure proper error handling:

- [ ] **Invalid PDF**: Upload non-PDF file → Should return 400
- [ ] **Missing siteId**: Upload without siteId → Should return 400
- [ ] **Invalid Site**: Process with non-existent siteId → Should fail gracefully
- [ ] **QStash Down**: If QStash unavailable → Document created but marked "failed"
- [ ] **Claude API Down**: If Claude fails → Risk factors set to ["Unable to analyze"]

## Rollback Procedure

If something goes wrong, rollback with:
```bash
# Revert API changes
git checkout app/api/documents/upload/route.ts
git checkout app/api/documents/process/route.ts

# Revert component changes
git checkout app/components/Navbar.tsx
git checkout app/components/Sidebar.tsx

# Restart server
npm run dev
```

## Common Issues & Solutions

### Issue: "401 Unauthorized" on Upload

**Root Cause**: Wrong token in `QSTASH_TOKEN`

**Solution**:
1. Go to https://console.upstash.com → QStash
2. Find the **publish/API token** (not signing key)
3. Update `QSTASH_TOKEN` in `.env.local`
4. Restart dev server

### Issue: Document Status Stuck on "processing"

**Root Causes**:
1. QStash can't reach webhook URL
2. Wrong signing key in `QSTASH_CURRENT_SIGNING_KEY`
3. Signature verification failing

**Solutions**:
1. Check Upstash dashboard → Messages → See delivery status
2. Verify signing key matches: `QSTASH_CURRENT_SIGNING_KEY`
3. Check app logs for signature verification errors
4. If dev: use ngrok tunnel for public URL

### Issue: Logo Still Shows 404

**Root Causes**:
1. `logo.png` doesn't exist in `/public`
2. Filename mismatch (uppercase/lowercase)
3. Build cache issue

**Solutions**:
1. Verify file exists: `ls public/logo.png`
2. Use exact lowercase filename: `logo.png`
3. Clear cache: `rm -rf .next && npm run build`
4. Restart dev server

### Issue: Claude Risk Analysis Empty

**Root Causes**:
1. `ANTHROPIC_API_KEY` not set
2. API key invalid or quota exceeded
3. Claude request malformed

**Solutions**:
1. Verify API key at https://console.anthropic.com
2. Check Claude quotas and usage
3. Check app logs for Claude errors
4. Test Claude separately: `curl -X POST https://api.anthropic.com/v1/messages ...`

## Verifying All Fixes Are Applied

Run this checklist to confirm all files are updated:
```bash
# 1. Check upload route has correct payload
grep -n "documentId, fileUrl, siteId, userId" app/api/documents/upload/route.ts
# Should find the publish call with all 4 fields

# 2. Check process route expects correct payload
grep -n "documentId, fileUrl, siteId, userId" app/api/documents/process/route.ts
# Should find the destructuring with all 4 fields

# 3. Check Navbar uses logo.png
grep -n "logo.png" app/components/Navbar.tsx
# Should find: src="/logo.png"

# 4. Check Sidebar uses logo.png
grep -n "logo.png" app/components/Sidebar.tsx
# Should find: src="/logo.png"

# 5. Check env template has token documentation
grep -n "QSTASH_TOKEN" .env.example
# Should show clear documentation about publish vs signing key
```

## Success Indicators

You'll know all fixes are working when:

1. ✅ Upload endpoint returns 202 with `documentId`
2. ✅ QStash shows message delivery in console
3. ✅ Process webhook called automatically after ~5 seconds
4. ✅ Document status changes to "processed"
5. ✅ Risk factors and score stored in database
6. ✅ Site risk_score updated correctly
7. ✅ Logo displays in UI (no 404)
8. ✅ No 401 errors in console

## Next Steps

After confirming all fixes work:

1. Deploy to production (Vercel)
2. Update environment variables in Vercel dashboard
3. Update `PROCESS_DOCUMENT_URL` to production domain
4. Test full flow in production
5. Monitor Upstash logs for successful deliveries
6. Check Anthropic API usage

## Need Help?

If you hit issues:

1. Check `/docs/QSTASH_SETUP.md` for token configuration
2. Check app logs: `vercel logs --follow`
3. Check Upstash dashboard for message delivery status
4. Review `/docs/API.md` for endpoint details
