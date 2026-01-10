"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type DashboardFilters = {
  council?: string;
  status?: string;
};

type DashboardFiltersBarProps = {
  councilOptions: string[];
  statusOptions: string[];
  initialFilters: DashboardFilters;
};

export default function DashboardFiltersBar({
  councilOptions,
  statusOptions,
  initialFilters,
}: DashboardFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = useMemo(
    () => ({
      council: initialFilters.council ?? "",
      status: initialFilters.status ?? "",
    }),
    [initialFilters]
  );

  const updateParam = (key: keyof DashboardFilters, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700"
        value={current.council}
        onChange={(event) => updateParam("council", event.target.value)}
      >
        <option value="">All councils</option>
        {councilOptions.map((council) => (
          <option key={council} value={council}>
            {council}
          </option>
        ))}
      </select>

      <select
        className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700"
        value={current.status}
        onChange={(event) => updateParam("status", event.target.value)}
      >
        <option value="">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}
