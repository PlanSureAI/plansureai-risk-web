# Deployment Checklist (Current State)

This checklist captures the exact state and steps for deploying PlanSureAI at this point in time.

## 1) Pre-Deployment Verification

Run these locally before deploying:

```bash
# Ensure env vars are loaded in your shell
source .env.local

# Verify the pipeline checks
bash scripts/test-pipeline.sh
```

Notes:
- The test script requires env vars to be present in the current shell.
- If env vars are missing, the script exits early.

## 2) Environment Variables (Where They Go)

### Vercel Project Settings → Environment Variables

Set these for **Production** (and Preview/Development as needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `QSTASH_TOKEN` (publish token)
- `QSTASH_CURRENT_SIGNING_KEY`
- `NEXT_PUBLIC_APP_URL`
- `PROCESS_DOCUMENT_URL`

Optional (if used):
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`

## 3) Database Migrations

Run these once per environment:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Optional seed:
```bash
npm run seed
```

## 4) Webhook Configuration

### Stripe Webhook

- Endpoint: `https://<your-domain>/api/stripe/webhooks`
- Events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### QStash Webhook

- Publish endpoint: `https://<your-domain>/api/documents/process`
- Tokens:
  - `QSTASH_TOKEN` = publish token
  - `QSTASH_CURRENT_SIGNING_KEY` = signing key

## 5) Build & Deploy

```bash
npm run build
vercel deploy --prod
```

## 6) Post-Deployment Smoke Tests

### Upload Pipeline

- Upload a PDF from the UI.
- Expect 202 response from `/api/documents/upload`.
- Verify status moves `processing` → `processed`.

### QStash Delivery

- Check Upstash QStash → Messages/Logs.
- Confirm message delivered (no 401/502).

### Database Checks

```sql
SELECT id, status, file_name, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 1;

SELECT id, risk_score, risk_factors, documents_count
FROM sites
WHERE id = '<site-id>';
```

### UI Checks

- Logo loads (no 404)
- Document upload progress bar works
- Upload status updates in real time

## 7) Rollback Procedure

```bash
# Revert to previous deployment in Vercel dashboard
# Or CLI:
vercel rollback
```

If necessary, revert code changes:
```bash
git revert <commit>
git push
```

## 8) Known Dependencies

- `supabaseAdmin` is used in webhook routes (requires `SUPABASE_SERVICE_ROLE_KEY`).
- `UploadStatusMonitor` uses client-side Supabase realtime subscriptions.
- `DocumentUpload` uses `/api/documents/upload` and expects 202 responses.

