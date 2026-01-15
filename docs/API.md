# PlanSureAI Backend API Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://plansureai.com/api`

## Authentication
All endpoints (except public shares) require authentication via Supabase Auth.

Include header: `Authorization: Bearer {session_token}`

---

## Endpoints

### Document Processing

#### POST `/documents/process`
Process a planning document (async via QStash)

**Request Body:**
```json
{
  "documentId": "uuid",
  "fileUrl": "https://...",
  "siteId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "uuid",
  "riskScore": {
    "overall_score": 65,
    "risk_level": "amber",
    "top_risks": [...],
    ...
  }
}
```

---

### Risk Scoring

#### POST `/risk/calculate`
Recalculate risk score for a site

**Request Body:**
```json
{
  "siteId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "assessment": {
    "overall_score": 65,
    "risk_level": "amber",
    ...
  }
}
```

---

### Approvals

#### GET `/approvals/nearby?siteId={id}&radiusKm=0.5`
Get nearby approved planning applications

**Response:**
```json
{
  "success": true,
  "count": 5,
  "approvals": [
    {
      "application_id": "APP001",
      "site_name": "123 High Street",
      "units": 12,
      "status": "approved",
      "distance_km": 0.2,
      ...
    }
  ]
}
```

---

### Portfolio

#### GET `/portfolio/metrics?userId={id}`
Get user's portfolio metrics and aggregated data

**Response:**
```json
{
  "success": true,
  "metrics": {
    "total_sites": 5,
    "total_units": 47,
    "estimated_gdv": 18500000,
    "by_risk_level": { "low": 2, "amber": 2, "red": 1 },
    "average_risk_score": 58.4
  },
  "sites": [...]
}
```

---

### Sharing

#### POST `/shares/create`
Create a shareable link for a site

**Request Body:**
```json
{
  "siteId": "uuid",
  "expiresInDays": 30,
  "recipientEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "shareUrl": "https://plansureai.com/share/abc123xyz",
  "token": "abc123xyz",
  "expiresAt": "2024-02-15T..."
}
```

#### GET `/shares/create?token={token}`
Get shared site (public endpoint)

**Response:**
```json
{
  "success": true,
  "site": {
    "id": "uuid",
    "name": "Site Name",
    "risk_score": 65,
    ...
  }
}
```

---

### Pre-App Packs

#### POST `/preapp/generate-pack`
Generate a pre-application pack for a site

**Request Body:**
```json
{
  "siteId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "pack_id": "uuid",
  "content": {
    "site_location_plan": "...",
    "constraints_summary": "...",
    "policy_compliance_checklist": [...],
    ...
  }
}
```

---

### Email Alerts

#### POST `/alerts/schedule`
Create an email alert subscription

**Request Body:**
```json
{
  "userId": "uuid",
  "alertType": "new_applications",
  "frequency": "weekly",
  "regions": ["Cornwall", "Devon"],
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "alert_id": "uuid",
  "message": "new_applications alerts scheduled weekly"
}
```

#### GET `/alerts/schedule?userId={id}`
Get user's alert subscriptions

#### DELETE `/alerts/schedule?alertId={id}`
Disable an alert subscription

---

## Error Responses

All errors return with appropriate HTTP status codes:

- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (missing/invalid auth)
- `404`: Not Found (resource doesn't exist)
- `500`: Server Error

**Error Response Format:**
```json
{
  "error": "Human readable error message",
  "details": "Technical error details (development only)"
}
```

---

## Rate Limiting

- Free tier: 100 requests/hour per user
- Starter: 1000 requests/hour
- Pro: 10,000 requests/hour
- Enterprise: Unlimited

---

## Webhooks

### Stripe Webhooks
Endpoint: `POST /stripe/webhooks`

Listens for:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
