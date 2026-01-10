import { Suspense } from 'react';
import ViabilityPageInner from './ViabilityPageInner';

export default function ViabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-center text-sm text-zinc-500">
          Loading viability analysis...
        </div>
      }
    >
      <ViabilityPageInner />
    </Suspense>
  );
}
