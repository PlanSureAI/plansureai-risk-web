# PlanSureAI Frontend Integration Guide

## Overview

The frontend is built with Next.js 14, React, and TypeScript. It provides a complete UI for property development risk assessment.

## Architecture

### Core Directories
```
/app
├── app/                 # Next.js App Router
│   ├── dashboard/       # Dashboard page
│   ├── sites/           # Sites management pages
│   ├── alerts/          # Alerts management
│   ├── approvals/       # Nearby approvals map
│   ├── portfolio/       # Portfolio dashboard
│   ├── settings/        # User settings
│   └── pricing/         # Pricing page
├── components/          # Reusable React components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── providers/           # Context providers
└── types/               # TypeScript type definitions
```

## Using Custom Hooks

### useRiskScore

Calculate and retrieve risk scores for a site.
```typescript
import { useRiskScore } from '@/app/hooks/useRiskScore';

export function MyComponent() {
  const { score, factors, loading } = useRiskScore(siteId);
  
  return (
    <div>
      <p>Risk Score: {score}</p>
      {factors.map(f => <p key={f}>{f}</p>)}
    </div>
  );
}
```

### usePortfolioMetrics

Get aggregated metrics for user's portfolio.
```typescript
import { usePortfolioMetrics } from '@/app/hooks/usePortfolioMetrics';

export function Dashboard() {
  const { metrics, loading } = usePortfolioMetrics();
  
  return (
    <div>
      <p>Total Sites: {metrics?.totalSites}</p>
      <p>Average Risk: {metrics?.averageRisk}%</p>
      <p>Total GDV: £{metrics?.totalGDV}</p>
    </div>
  );
}
```

### useNearbyApprovals

Fetch nearby approved applications for a location.
```typescript
import { useNearbyApprovals } from '@/app/hooks/useNearbyApprovals';

export function ApprovalsMap() {
  const { approvals, loading } = useNearbyApprovals({
    lat: 51.5074,
    lng: -0.1278,
    radiusKm: 5
  });
  
  return <MapComponent approvals={approvals} />;
}
```

### useDocumentUpload

Handle PDF document uploads with automatic processing.
```typescript
import { useDocumentUpload } from '@/app/hooks/useDocumentUpload';

export function UploadForm() {
  const { upload, loading, error } = useDocumentUpload();
  
  const handleUpload = async (file: File) => {
    const result = await upload(file, siteId);
    console.log('Uploaded:', result);
  };
  
  return <input type="file" onChange={e => handleUpload(e.target.files![0])} />;
}
```

### useShareLink

Generate and manage shareable analysis links.
```typescript
import { useShareLink } from '@/app/hooks/useShareLink';

export function ShareDialog() {
  const { generateLink, shareLinks, loading } = useShareLink();
  
  const handleShare = async () => {
    const link = await generateLink(siteId, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });
    console.log('Share link:', link.url);
  };
  
  return <button onClick={handleShare}>Generate Link</button>;
}
```

### useEmailAlerts

Manage email alert subscriptions.
```typescript
import { useEmailAlerts } from '@/app/hooks/useEmailAlerts';

export function AlertsManager() {
  const { alerts, subscribe, unsubscribe, loading } = useEmailAlerts();
  
  return (
    <div>
      {alerts.map(alert => (
        <button key={alert.id} onClick={() => unsubscribe(alert.id)}>
          Unsubscribe from {alert.type}
        </button>
      ))}
    </div>
  );
}
```

## Using Components

### RiskScoreCard

Display a site's risk score with color coding.
```typescript
<RiskScoreCard siteId="site-123" score={45.5} />
```

### PortfolioDashboard

Show aggregated portfolio metrics and charts.
```typescript
<PortfolioDashboard metrics={metrics} />
```

### DocumentUpload

File upload component with drag-and-drop.
```typescript
<DocumentUpload onComplete={(file) => console.log(file)} />
```

### ShareLinkGenerator

Create and display shareable analysis links.
```typescript
<ShareLinkGenerator siteId="site-123" />
```

### NearbyApprovalsMap

Interactive map showing nearby approved applications.
```typescript
<NearbyApprovalsMap lat={51.5} lng={-0.1} radiusKm={5} />
```

### PricingPage

Display pricing tiers and subscription options.
```typescript
<PricingPage />
```

## Using Utility Functions

### formatters.ts
```typescript
import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatRiskScore,
  formatRelativeTime,
  formatAddress,
  formatGDV,
} from '@/app/lib/formatters';

// Format number as GBP currency
formatCurrency(1500); // £1,500

// Format date in en-GB locale
formatDate('2024-01-15'); // 15 January 2024

// Format file size
formatFileSize(1024000); // 1000 KB

// Format risk score with color
const { score, color, level } = formatRiskScore(45);
// { score: '45', color: 'amber', level: 'Medium' }

// Format relative time
formatRelativeTime('2024-01-14'); // 1d ago

// Format UK address
formatAddress({
  line1: '123 Main St',
  city: 'London',
  postcode: 'SW1A 1AA'
});

// Format GDV with M/K suffix
formatGDV(2500000); // £2.5M
```

### validation.ts
```typescript
import {
  validateEmail,
  validatePostcode,
  validateGDV,
  validateFileSize,
} from '@/app/lib/validation';

validateEmail('test@example.com'); // true
validatePostcode('SW1A 1AA'); // true
validateGDV(1000000); // true
validateFileSize(5242880, 10485760); // true (5MB < 10MB limit)
```

### api-client.ts
```typescript
import { apiClient } from '@/app/lib/api-client';

// GET request
const sites = await apiClient.get('/api/sites');

// POST request
const newSite = await apiClient.post('/api/sites', {
  name: 'My Site',
  reference: 'SITE-001',
});

// PUT request
await apiClient.put(`/api/sites/${siteId}`, updatedData);

// DELETE request
await apiClient.delete(`/api/sites/${siteId}`);
```

## Authentication Flow

Users are authenticated via Supabase Auth. The `AuthProvider` at the root layout handles session management.
```typescript
import { useAuthContext } from '@/app/providers/AuthProvider';

export function MyComponent() {
  const { session, user, loading, signOut } = useAuthContext();
  
  if (loading) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Theme Switching

The app supports dark mode via the `ThemeProvider`.
```typescript
import { useTheme } from '@/app/providers/ThemeProvider';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

## Error Handling

Wrap components with `ErrorBoundary` to catch errors.
```typescript
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

Or use the global error boundary that already wraps the app in the root layout.

## Best Practices

1. **Always use hooks** - Prefer custom hooks over direct API calls
2. **Type everything** - Use TypeScript types from `/app/types`
3. **Handle loading states** - All hooks return a `loading` state
4. **Validate input** - Use validation utils before sending data
5. **Format display data** - Use formatter utils for consistent display
6. **Protect routes** - Check `session` in page components
7. **Use error boundaries** - Wrap sections to catch errors gracefully

## Styling

The app uses Tailwind CSS. All components follow utility-first approach.
```typescript
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>
</div>
```

## Component Props

All component props are TypeScript-typed. Check the component files for available props.
```typescript
interface RiskScoreCardProps {
  siteId: string;
  score: number;
}

export function RiskScoreCard({ siteId, score }: RiskScoreCardProps) {
  // ...
}
```
