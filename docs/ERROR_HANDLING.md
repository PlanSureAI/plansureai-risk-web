# Error Handling Guide - Upload Pipeline

## Error Types & Responses

### Client-Side Errors (Upload Validation)

#### 1. VALIDATION_ERROR - Invalid File Type
```
Message: "Only PDF files are supported"
Status: 400
Cause: User selected non-PDF file
Action: Show error, allow retry with correct file
```

#### 2. FILE_TOO_LARGE - Exceeds 10MB
```
Message: "File is too large. Maximum size is 10MB, your file is X.XMB"
Status: 400
Cause: PDF larger than 10MB limit
Action: Ask user to split document or reduce size
```

#### 3. FILE_TOO_SMALL - Less than 100KB
```
Message: "File is too small. Please upload a document with at least some content"
Status: 400
Cause: PDF has minimal content
Action: Ensure document has actual content before uploading
```

#### 4. NETWORK_ERROR - Connection Failed
```
Message: "Network error. Check your connection."
Cause: No internet or proxy issues
Action: Check connection, retry upload
```

#### 5. UPLOAD_CANCELLED - User Cancelled
```
Message: "Upload cancelled"
Cause: User clicked "Cancel Upload" button
Action: Allow restart of upload
```

### Server-Side Errors (Upload Processing)

#### 1. 401 Unauthorized - Invalid QStash Token
```
Message: "Unauthorized"
Status: 401
Cause: QSTASH_TOKEN is wrong or signing key pasted there
Fix:
1. Go to Upstash console → QStash
2. Get the PUBLISH token (not signing key)
3. Update QSTASH_TOKEN in .env.local
4. Restart server
```

#### 2. 401 Signature Verification Failed
```
Message: "Invalid signature"
Status: 401
Cause: QSTASH_CURRENT_SIGNING_KEY wrong or expired
Fix:
1. Go to Upstash console → QStash → Signing Keys
2. Copy the CURRENT KEY
3. Update QSTASH_CURRENT_SIGNING_KEY in .env.local
4. Restart server
```

#### 3. 404 Not Found - Invalid Site
```
Message: "Site not found"
Status: 404
Cause: siteId doesn't exist in database
Fix: Ensure site created before uploading documents
```

#### 4. 413 Payload Too Large
```
Message: "File is too large"
Status: 413
Cause: Server size limit exceeded (usually handled by validation first)
Fix: Reduce file size before upload
```

#### 5. 500 Internal Server Error
```
Common causes:
- Supabase connection failed
- PDF parsing failed
- Anthropic API error
- Database insert failed

How to debug:
1. Check app logs: `vercel logs --follow`
2. Check Supabase status page
3. Check Anthropic API status
4. Review error message in logs

Action: Retry, or contact support with error details
```

## Handling Errors in Components

### useDocumentUpload Hook
```typescript
const { upload, loading, progress, error, cancel, reset } = useDocumentUpload();

try {
  const result = await upload(file, siteId);
  // Success - result contains { documentId, fileName, status }
} catch (err) {
  // Error - err.code indicates error type
  // err.message is user-friendly message
  // err.statusCode available if from server
  
  switch (err.code) {
    case 'FILE_TOO_LARGE':
      // Show message about file size
      break;
    case 'VALIDATION_ERROR':
      // Show validation message
      break;
    case 'NETWORK_ERROR':
      // Suggest retry
      break;
    default:
      // Generic error handling
  }
}
```

### DocumentUpload Component

The component handles errors internally and shows:
- Error message explaining what went wrong
- Retry button (if retriable)
- Suggestions for user
```typescript
<DocumentUpload
  siteId={siteId}
  onComplete={(result) => {
    // Handle success
    console.log('Uploaded:', result.documentId);
  }}
  onError={(error) => {
    // Handle error
    console.error('Upload failed:', error.message);
    // Could show toast notification, etc.
  }}
/>
```

## Error Recovery

### Automatic Retry
The upload component automatically retries on transient failures:
- Network timeouts (max 5 min)
- Temporary server errors (5xx)
- QStash delivery failures (automatic backoff)

### Manual Retry
Users can click "Retry" button for:
- File validation errors (select different file)
- Network errors (if connection restored)
- API errors (if service recovered)

### Processing Failures
If document uploaded but processing failed:
- Document created with status "failed"
- Error message stored in `error_message` field
- User can delete and reupload
- Consider implementing reprocessing endpoint

## Monitoring & Alerting

### What to Monitor
```bash
# Upload endpoint errors
# Track 4xx and 5xx responses in /api/documents/upload

# QStash delivery failures
# Monitor in Upstash dashboard → Messages
# Check delivery attempts and retries

# Processing failures
# Query database for documents with status='failed'
SELECT COUNT(*) FROM documents WHERE status = 'failed'

# Claude API errors
# Monitor error logs for API failures
# Check Anthropic usage and quotas
```

### Production Error Logging

Add to your error handling:
```typescript
// Example with Sentry or similar service
if (error.statusCode >= 500) {
  captureException(error, {
    level: 'error',
    tags: {
      component: 'DocumentUpload',
      action: 'upload',
      documentId: documentId,
    },
    contexts: {
      upload: {
        fileSize: file.size,
        fileName: file.name,
        siteId: siteId,
      },
    },
  });
}
```

## Error Messages - User Friendly

### Shown to Users
```
"Only PDF files are supported"
→ Clear, specific, actionable

"File is too large. Maximum size is 10MB"
→ States the limit and current size

"Network error. Check your connection."
→ Helps user troubleshoot

"Upload failed. Please try again."
→ Reassuring, gives retry option
```

### NOT Shown to Users
```
"ECONNREFUSED localhost:6379"
→ Too technical

"Supabase API key is invalid"
→ Reveals infrastructure details

"Claude request timed out after 30s"
→ Confusing for non-technical user
```

## Testing Error Scenarios

### Simulate Upload Errors
```bash
# Test file validation
curl -X POST http://localhost:3000/api/documents/upload \\
  -F "file=@image.jpg" \\
  -F "siteId=test"
# Should return: "Only PDF files are supported"

# Test missing siteId
curl -X POST http://localhost:3000/api/documents/upload \\
  -F "file=@sample.pdf"
# Should return: "No siteId provided"

# Test QStash token error
# Temporarily set wrong QSTASH_TOKEN
# Should return: "401 Unauthorized"
```

### Test Processing Errors
```bash
# Force processing failure
# Temporarily set invalid ANTHROPIC_API_KEY
# Upload document
# Check database: status should be 'failed'
# Error message should be stored
```

## Best Practices

1. **Always catch errors** - Don't let uploads fail silently
2. **Provide clear feedback** - Tell user what went wrong
3. **Enable retries** - Network issues are temporary
4. **Log errors** - For debugging and monitoring
5. **Don't expose internals** - User messages should be friendly
6. **Validate early** - Check file before uploading
7. **Set timeouts** - Prevent hanging requests
8. **Monitor production** - Track error rates and types

## Troubleshooting Flowchart
