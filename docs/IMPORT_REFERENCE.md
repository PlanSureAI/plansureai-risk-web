# Import Reference - Supabase & Components

## Supabase Client Imports

### Browser/Client Components
```typescript
// Recommended: Named import
import { supabase } from '@/app/lib/supabase';

const { data, error } = await supabase
  .from('documents')
  .select('*');

// Alternative: Also available as supabaseClient
import { supabaseClient } from '@/app/lib/supabase';

const { data } = await supabaseClient.from('sites').select('*');

// Note: supabase and supabaseClient are identical - use either
```

### Real-Time Subscriptions in Client Components
```typescript
'use client';

import { supabase } from '@/app/lib/supabase';

// Subscribe to changes
const subscription = supabase
  .from('documents')
  .on('*', (payload) => {
    console.log('Change received!', payload);
  })
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### Server Components / API Routes

For authentication and server-side queries:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = cookies();
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
```

## Component Imports

### Hooks
```typescript
// Document upload with progress
import { useDocumentUpload } from '@/app/hooks/useDocumentUpload';

// Portfolio metrics
import { usePortfolioMetrics } from '@/app/hooks/usePortfolioMetrics';

// Risk scoring
import { useRiskScore } from '@/app/hooks/useRiskScore';

// Nearby approvals
import { useNearbyApprovals } from '@/app/hooks/useNearbyApprovals';

// Share links
import { useShareLink } from '@/app/hooks/useShareLink';

// Pre-app packs
import { usePreAppPack } from '@/app/hooks/usePreAppPack';

// Email alerts
import { useEmailAlerts } from '@/app/hooks/useEmailAlerts';

// Authentication
import { useAuth } from '@/app/hooks/useAuth';
import { useUser } from '@/app/hooks/useUser';

// Theme
import { useTheme } from '@/app/providers/ThemeProvider';

// Auth context
import { useAuthContext } from '@/app/providers/AuthProvider';
```

### Components
```typescript
// Upload & Progress
import { DocumentUpload } from '@/app/components/DocumentUpload';
import { UploadStatusMonitor } from '@/app/components/UploadStatusMonitor';

// Risk & Portfolio
import { RiskScoreCard } from '@/app/components/RiskScoreCard';
import { PortfolioDashboard } from '@/app/components/PortfolioDashboard';

// Maps & Sharing
import { NearbyApprovalsMap } from '@/app/components/NearbyApprovalsMap';
import { ShareLinkGenerator } from '@/app/components/ShareLinkGenerator';

// Alerts & Packs
import { EmailAlertsManager } from '@/app/components/EmailAlertsManager';
import { PreAppPackViewer } from '@/app/components/PreAppPackViewer';

// Pricing
import { PricingPage } from '@/app/components/PricingPage';

// Layout
import { MainLayout } from '@/app/components/MainLayout';
import { Navbar } from '@/app/components/Navbar';
import { Sidebar } from '@/app/components/Sidebar';
import { Footer } from '@/app/components/Footer';

// Utilities
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { LoadingSkeleton, RiskScoreSkeleton, TableSkeleton } from '@/app/components/LoadingSkeleton';
```

### Utilities
```typescript
// Formatting
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  truncateText,
  formatAddress,
  formatRiskScore,
  formatGDV,
  formatSiteReference,
} from '@/app/lib/formatters';

// API Client
import { apiClient } from '@/app/lib/api-client';

// Validation
import {
  validateEmail,
  validatePostcode,
  validateGDV,
  validateFileSize,
} from '@/app/lib/validation';

// Types
import type { Database } from '@/app/types/database';
import type { 
  Site, 
  Document, 
  Portfolio, 
  RiskScore 
} from '@/app/types/index';
```

## Providers
```typescript
// Wrap your app with these providers
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// In root layout:
<ErrorBoundary>
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
</ErrorBoundary>
```

## Common Import Patterns

### Upload with Progress Tracking
```typescript
'use client';

import { DocumentUpload } from '@/app/components/DocumentUpload';
import { UploadStatusMonitor } from '@/app/components/UploadStatusMonitor';

export function SiteDocumentsSection() {
  return (
    <div className="space-y-6">
      <DocumentUpload
        siteId="site-123"
        onComplete={(result) => {
          console.log('Upload complete:', result.documentId);
        }}
        onError={(error) => {
          console.error('Upload failed:', error.message);
        }}
      />
      <UploadStatusMonitor siteId="site-123" />
    </div>
  );
}
```

### Dashboard with Portfolio Metrics
```typescript
'use client';

import { usePortfolioMetrics } from '@/app/hooks/usePortfolioMetrics';
import { PortfolioDashboard } from '@/app/components/PortfolioDashboard';
import { LoadingSkeleton } from '@/app/components/LoadingSkeleton';

export function MyDashboard() {
  const { metrics, loading } = usePortfolioMetrics();

  if (loading) return <LoadingSkeleton />;
  if (!metrics) return <div>No data</div>;

  return <PortfolioDashboard metrics={metrics} />;
}
```

### Authenticated Page with Layout
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { MainLayout } from '@/app/components/MainLayout';

export default function ProtectedPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!session) return null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Your protected content */}
      </div>
    </MainLayout>
  );
}
```

### Using Supabase Client Directly
```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export function SitesList() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data
    const fetchSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSites(data);
      } catch (error) {
        console.error('Error fetching sites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();

    // Subscribe to changes
    const subscription = supabase
      .from('sites')
      .on('*', (payload) => {
        // Handle real-time updates
        console.log('Site updated:', payload);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {sites.map((site) => (
        <li key={site.id}>{site.name}</li>
      ))}
    </ul>
  );
}
```

## Import Rules & Best Practices

### ✅ Do This
```typescript
// Use named imports from utilities
import { formatCurrency, formatDate } from '@/app/lib/formatters';

// Use 'use client' directive in client components
'use client';
import { useDocumentUpload } from '@/app/hooks/useDocumentUpload';

// Import types with 'type' keyword
import type { Database } from '@/app/types/database';

// Use specific imports (not wildcard)
import { supabase } from '@/app/lib/supabase';
```

### ❌ Don't Do This
```typescript
// Don't import everything with wildcard
import * as formatters from '@/app/lib/formatters';

// Don't mix server and client context
// (e.g., using hooks in Server Components)

// Don't use relative paths - use @ alias
import { Navbar } from '../../../components/Navbar';  // ❌
import { Navbar } from '@/app/components/Navbar';      // ✅

// Don't forget 'use client' in client components
import { useAuth } from '@/app/hooks/useAuth';  // ❌ Missing 'use client'
```

## File Organization Reference
```
/app
├── api/                          # API routes
│   ├── documents/upload/         # Document upload endpoint
│   ├── documents/process/        # Document processing webhook
│   ├── risk/                     # Risk calculation endpoints
│   ├── portfolio/                # Portfolio metrics endpoints
│   ├── shares/                   # Share link endpoints
│   ├── alerts/                   # Email alert endpoints
│   └── stripe/                   # Payment processing endpoints
│
├── components/                   # React components
│   ├── DocumentUpload.tsx
│   ├── UploadStatusMonitor.tsx
│   ├── RiskScoreCard.tsx
│   ├── PortfolioDashboard.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   ├── MainLayout.tsx
│   └── ...more components
│
├── hooks/                        # Custom React hooks
│   ├── useDocumentUpload.ts
│   ├── usePortfolioMetrics.ts
│   ├── useRiskScore.ts
│   ├── useAuth.ts
│   └── ...more hooks
│
├── lib/                          # Utility functions & clients
│   ├── supabase.ts              # Supabase client instance
│   ├── api-client.ts            # API request helper
│   ├── formatters.ts            # Format utilities
│   ├── validation.ts            # Validation utilities
│   ├── pdf-processor.ts         # PDF extraction
│   ├── embeddings.ts            # Vector embeddings
│   └── risk-calculator.ts       # Risk scoring logic
│
├── providers/                    # React context providers
│   ├── AuthProvider.tsx
│   └── ThemeProvider.tsx
│
├── types/                        # TypeScript type definitions
│   ├── index.ts
│   └── database.ts              # Supabase types
│
└── app/                          # Next.js App Router pages
    ├── dashboard/page.tsx
    ├── sites/page.tsx
    ├── sites/[id]/page.tsx
    ├── settings/page.tsx
    └── ...more pages
```

## Supabase Client Usage Context

### When to Use `supabase` (Client Component)
- Real-time subscriptions (`.on()`, `.subscribe()`)
- Client-side queries with user auth
- Browser-only operations (localStorage, etc.)
```typescript
'use client';

import { supabase } from '@/app/lib/supabase';

// ✅ This works - client context
const { data } = await supabase.from('documents').select('*');
```

### When to Use `createServerClient` (API Route / Server Component)
- Server-side authentication
- Service role operations (require SERVICE_ROLE_KEY)
- Session management
- Server-to-database queries
```typescript
import { createServerClient } from '@supabase/ssr';

// ✅ This works - server context
const supabase = createServerClient(...);
const { data } = await supabase.from('d
