# Supabase Client Usage Guide

## Three Different Supabase Clients

PlanSureAI uses three different Supabase client types for different purposes. Understanding which to use where is critical for security and correct behavior.

### 1. Client Browser (`supabase`)

**What it is:**
- Runs in browser/client component
- Uses anon key (public, safe to expose)
- Respects Row Level Security (RLS) policies
- Cannot access data user isn't authorized for

**When to use:**
- Client components (with `'use client'`)
- Real-time subscriptions
- User-facing queries and mutations
- Upload/download operations

**Example:**
```typescript
'use client';

import { supabase } from '@/app/lib/supabase';

export function DocumentsList() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    // This query respects RLS - user only sees their own documents
    supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDocs(data || []));
  }, []);

  return <div>{/* render docs */}</div>;
}
```

**Security Properties:**
- ✅ Limited by RLS policies
- ✅ User-specific data access
- ✅ Safe to use in browser
- ❌ Cannot do admin operations

---

### 2. Server Client (`createServerClient`)

**What it is:**
- Created in API routes or Server Components
- Uses anon key (from cookies)
- Respects Row Level Security (RLS) policies
- Authenticates the user from their session

**When to use:**
- API routes that need user context
- Server Components that need auth
- Operations that require verified user identity
- Calls that should respect RLS

**Example:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  // Create authenticated server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          cookieStore.delete(name);
        },
      },
    }
  );

  // Get authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query respects RLS - user can only access their own data
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', session.user.id);

  return NextResponse.json(data);
}
```

**Security Properties:**
- ✅ Requires user authentication
- ✅ Respects RLS policies
- ✅ User context preserved
- ❌ Cannot bypass RLS
- ❌ Cannot do admin operations

---

### 3. Admin Client (`supabaseAdmin`)

**What it is:**
- Server-only client with full database access
- Uses service role key (secret, never expose to client)
- Bypasses Row Level Security completely
- Has unrestricted database access

**When to use:**
- Webhook handlers that need to update records
- Service-level operations needing full access
- Batch operations for admin purposes
- Operations that genuinely need to bypass RLS

**CRITICAL: Only use in API routes, NEVER in client code**

**Example:**
```typescript
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifySignature } from '@upstash/qstash/nextjs';

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const isValid = await verifySignature({
    signature: request.headers.get('upstash-signature') || '',
    body: await request.text(),
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = await request.json();
  const { documentId, riskScore, riskFactors } = body;

  // Use admin client to update document and site
  // (Webhook handler needs to update records regardless of RLS)
  await supabaseAdmin
    .from('documents')
    .update({
      status: 'processed',
      extracted_info: { riskScore },
      risk_factors: riskFactors,
    })
    .eq('id', documentId);

  // Update site risk score
  const { data: doc } = await supabaseAdmin
    .from('documents')
    .select('site_id')
    .eq('id', documentId)
    .single();

  if (doc?.site_id) {
    await supabaseAdmin
      .from('sites')
      .update({ risk_score: riskScore })
      .eq('id', doc.site_id);
  }

  return NextResponse.json({ success: true });
}
```

**Security Properties:**
- ✅ Full database access
- ✅ Can bypass RLS
- ❌ VERY POWERFUL - use carefully
- ❌ Must keep key secret
- ❌ Never expose to client

---

## Decision Tree: Which Client to Use?
```
Starting point: Where is my code running?

├─ CLIENT COMPONENT ('use client')
│  └─ Use: import { supabase } from '@/app/lib/supabase'
│     └─ Always respects RLS
│     └─ User-specific access only
│     └─ Real-time subscriptions work here
│
├─ API ROUTE or SERVER COMPONENT
│  │
│  ├─ Do I need to verify user identity?
│  │  ├─ YES → Use: createServerClient()
│  │  │         └─ Get user from session
│  │  │         └─ Respects RLS
│  │  │         └─ User-specific queries
│  │  │
│  │  └─ NO → Do I need to bypass RLS?
│  │      ├─ YES → Use: import { supabaseAdmin } from '@/app/lib/supabase'
│  │      │         └─ Full database access
│  │      │         └─ No RLS restrictions
│  │      │         └─ Use for webhooks, batch ops, etc.
│  │      │
│  │      └─ NO → Use: createServerClient()
│  │              └─ No auth needed but still respects RLS
│  │              └─ Safer default
│  │
│  └─ IMPORTANT: Never use client supabase in API routes
│                 (will fail - can't access browser APIs)
│
└─ SOMEWHERE ELSE?
   └─ Rethink architecture - code should be in above locations
```

---

## Common Patterns

### Pattern 1: User Uploads Document (Client)
```typescript
'use client';

import { supabase } from '@/app/lib/supabase';
import { useAuthContext } from '@/app/providers/AuthProvider';

export function DocumentForm() {
  const { session } = useAuthContext();

  const handleUpload = async (file: File, siteId: string) => {
    // Upload file
    const { data: uploadData } = await supabase.storage
      .from('documents')
      .upload(`${siteId}/${file.name}`, file);

    if (!uploadData) return;

    // Create document record (RLS ensures user_id matches session)
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        site_id: siteId,
        user_id: session.user.id,  // Automatically set, RLS enforces it
        file_name: file.name,
        file_url: uploadData.path,
        status: 'processing',
      })
      .select()
      .single();

    console.log('Document created:', doc.id);
  };

  return <form onSubmit={(e) => handleUpload(/*...*/)}>...</form>;
}
```

### Pattern 2: Webhook Updates Document (Admin)
```typescript
// /app/api/documents/process/route.ts

import { supabaseAdmin } from '@/app/lib/supabase';
import { verifySignature } from '@upstash/qstash/nextjs';

export async function POST(request: NextRequest) {
  // 1. Verify webhook is from QStash
  const isValid = await verifySignature({
    signature: request.headers.get('upstash-signature') || '',
    body: await request.text(),
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse webhook payload
  const { documentId, riskScore, riskFactors } = await request.json();

  // 3. Use admin client to update (no user context, service operation)
  const { error } = await supabaseAdmin
    .from('documents')
    .update({
      status: 'processed',
      extracted_info: { riskScore },
      risk_factors: riskFactors,
      processed_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (error) {
    console.error('Update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### Pattern 3: API Route with Auth (Server Client)
```typescript
// /app/api/sites/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();

  // Create authenticated server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          cookieStore.delete(name);
        },
      },
    }
  );

  // Get authenticated user
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query only user's sites (RLS enforced)
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json(sites);
}
```

---

## Security Checklist

### ✅ DO THIS
```typescript
// ✅ Use supabase in client components
'use client';
import { supabase } from '@/app/lib/supabase';

// ✅ Use createServerClient in API routes with auth needed
import { createServerClient } from '@supabase/ssr';

// ✅ Use supabaseAdmin in API routes for webhooks
import { supabaseAdmin } from '@/app/lib/supabase';

// ✅ Verify webhook signatures before using supabaseAdmin
const isValid = await verifySignature({ /* ... */ });
if (!isValid) return 401;

// ✅ Never return raw admin queries to client
const data = await supabaseAdmin.from('table').select('*');
return NextResponse.json(data.filter(/* sanitize */));

// ✅ Keep SERVICE_ROLE_KEY secret in .env.local (never in .env.example)
SUPABASE_SERVICE_ROLE_KEY=sk_...  // In .env.local only
```

### ❌ DON'T DO THIS
```typescript
// ❌ Never use supabaseAdmin in client components
'use client';
import { supabaseAdmin } from '@/app/lib/supabase';  // WRONG!

// ❌ Never expose SERVICE_ROLE_KEY to client
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
fetch('/api/secret', { body: { key } });  // WRONG!

// ❌ Never skip webhook signature verification
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Use supabaseAdmin immediately - WRONG! No verification
  await supabaseAdmin.from('table').update(body);
}

// ❌ Never use supabase in API routes without checking auth
export async function POST() {
  // supabase is client-only, won't have session here
  const { data } = await supabase.from('table').select('*');  // WRONG!
}

// ❌ Never commit SERVICE_ROLE_KEY to git
git add .env.local  // WRONG! Use .gitignore

// ❌ Never log sensitive data
console.log('Processing with key:', SUPABASE_SERVICE_ROLE_KEY);  // WRONG!
```

---

## Key Differences Summary

| Feature | Client `supabase` | Server `createServerClient` | Admin `supabaseAdmin` |
|---------|------|------|------|
| **Where to use** | Client components | API routes with auth | API webhooks |
| **Key type** | Anon (public) | Anon (public) | Service role (secret) |
| **RLS applied** | Yes | Yes | No |
| **User context** | From browser | From session | None |
| **Real-time subs** | Yes | No | No |
| **Full DB access** | No | No | Yes |
| **Safe to expose** | Yes | No | No |

---

## Troubleshooting

### Error: "Cannot use client supabase in API route"
```
Problem: Using `import { supabase }` in an API route
Solution: Use createServerClient() instead
```

### Error: "RLS policy blocks query"
```
Problem: Query respects RLS but user not authorized
Solutions:
1. Check RLS policy allows the operation
2. Verify user_id matches
3. Check column permissions
4. Consider using supabaseAdmin if legitimate need
```

### Error: "SERVICE_ROLE_KEY not found"
