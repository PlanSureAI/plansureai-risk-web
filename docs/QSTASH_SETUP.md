# QStash Configuration Guide

## What is QStash?

QStash is a serverless message queue service from Upstash. PlanSureAI uses it to:
- Queue document processing jobs asynchronously
- Ensure documents don't block the upload endpoint
- Retry failed processing automatically
- Track job status

## Two Different QStash Tokens

QStash has **two different tokens with different purposes**. This is the most common source of configuration errors.

### 1. QSTASH_TOKEN (Publish Token) 📤

**Purpose**: Used by your app to SEND jobs to QStash

**Used in**: `/app/api/documents/upload/route.ts`

**What it looks like**: `eyJhbGciOiJIUzI1NiJ9...` (long random string)

**Where to find it**:
1. Go to https://console.upstash.com
2. Click "QStash" (or "Upstash" → "QStash")
3. Find "Default token" or "Tokens" section
4. Copy the publish/API token (NOT the signing key)

**Error if wrong**: `401 Unauthorized` when trying to upload documents

### 2. QSTASH_CURRENT_SIGNING_KEY (Verification Key) ✅

**Purpose**: Used by your app to VERIFY that messages come from QStash

**Used in**: `/app/api/documents/process/route.ts`

**What it looks like**: A key that starts with `sig_` or a base64 string

**Where to find it**:
1. Go to https://console.upstash.com → QStash
2. Look for "Signing Keys" section
3. Copy the "Current Key" value (this is NOT the publish token)

**Error if wrong**: `401 Invalid signature` when processing documents

## Configuration Steps

### Step 1: Get Publish Token
```
Console → QStash → Tokens section → Copy "Default token" or "API Token"
```

Add to `.env.local`:
```bash
QSTASH_TOKEN=eyJhbGciOiJIUzI1NiJ9...
```

### Step 2: Get Signing Key
```
Console → QStash → Signing Keys section → Copy "Current Key"
```

Add to `.env.local`:
```bash
QSTASH_CURRENT_SIGNING_KEY=your-signing-key-here
```

### Step 3: Set App URL

QStash needs to know where to send webhook callbacks:
```bash
PROCESS_DOCUMENT_URL=https://your-domain.com/api/documents/process
```

Or use your app URL:
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
# QStash will callback to {APP_URL}/api/documents/process
```

### Step 4: Test Configuration
```bash
# Start development server
npm run dev

# Upload a document - should see:
# - 202 response in upload endpoint
# - Document record created with status "processing"
# - After ~5 seconds: webhook called, status updated to "processed"
```

## Common Errors & Fixes

### Error: `401 Unauthorized` on Upload

**Cause**: Wrong token in `QSTASH_TOKEN`

**Fix**:
1. Go to https://console.upstash.com → QStash
2. Copy the **publish/API token** (not signing key)
3. Paste into `QSTASH_TOKEN` in `.env.local`
4. Restart server

### Error: `401 Invalid signature` on Processing

**Cause**: Wrong key in `QSTASH_CURRENT_SIGNING_KEY`

**Fix**:
1. Go to https://console.upstash.com → QStash → Signing Keys
2. Copy the **Current Key** value
3. Paste into `QSTASH_CURRENT_SIGNING_KEY` in `.env.local`
4. Restart server

### Error: `502 Bad Gateway` When QStash Calls Back

**Cause**: `PROCESS_DOCUMENT_URL` is wrong or unreachable

**Fix**:
1. Make sure `PROCESS_DOCUMENT_URL` is set to your public domain
2. In development, use a tunnel: `npm install -g ngrok` then `ngrok http 3000`
3. Update `PROCESS_DOCUMENT_URL` to the ngrok URL
4. Or skip webhook verification in dev (not recommended)

### Error: Wrong Token Type Pasted

**Common mistake**: Copying signing key into `QSTASH_TOKEN`

**Look for**:
- `QSTASH_TOKEN`: Long alphanumeric string, no special prefix
- `QSTASH_CURRENT_SIGNING_KEY`: Often prefixed with `sig_` or starts with special characters

## Testing QStash Setup

### Local Testing with ngrok
```bash
# In terminal 1: Start your app
npm run dev

# In terminal 2: Create tunnel
npx ngrok http 3000
# Gives you: https://abc123.ngrok.io

# In terminal 3: Test upload
curl -X POST http://localhost:3000/api/documents/upload \\
  -F "file=@sample.pdf" \\
  -F "siteId=site-123" \\
  -H "Authorization: Bearer YOUR_JWT"
```

### Check QStash Dashboard

1. Go to https://console.upstash.com → QStash
2. Look for "Logs" or "Messages" tab
3. See your queued messages and delivery status
4. Check webhook delivery attempts

## Key Rotation (Advanced)

If you need to rotate signing keys:

1. QStash will generate a new "Current Key" and move the old one to "Previous Key"
2. Update `QSTASH_CURRENT_SIGNING_KEY` to the new key
3. Optionally set `QSTASH_NEXT_SIGNING_KEY` to the old key during transition
4. After transition period, remove `QSTASH_NEXT_SIGNING_KEY`

## Production Checklist

- [ ] `QSTASH_TOKEN` set to **publish token** (not signing key)
- [ ] `QSTASH_CURRENT_SIGNING_KEY` set to **current signing key**
- [ ] `PROCESS_DOCUMENT_URL` set to production domain with https
- [ ] Tested full upload → process flow
- [ ] Checked QStash dashboard for message delivery
- [ ] Confirmed documents marked as "processed" in database
- [ ] Risk scores updated correctly

## Troubleshooting

If documents stay in "processing" status:

1. Check QStash logs for delivery errors
2. Verify webhook URL is accessible: `curl https://your-domain.com/api/documents/process`
3. Check app logs for webhook processing errors
4. Verify signing key is correct

If you see requests but signature verification fails:

1. Confirm `QSTASH_CURRENT_SIGNING_KEY` matches console value exactly
2. Check for whitespace or line breaks in `.env.local`
3. Restart the server after changing env vars

## Support

- QStash Docs: https://upstash.com/docs/qstash/overview
- QStash Dashboard: https://console.upstash.com
- GitHub Issues: Create an issue if QStash integration fails
