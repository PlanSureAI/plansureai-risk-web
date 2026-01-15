import { useState, useEffect, useCallback } from "react";
import { PortfolioMetrics, Site } from "@/app/types";

interface UsePortfolioMetricsState {
  metrics: PortfolioMetrics | null;
  sites: Site[];
  loading: boolean;
  error: string | null;
}

export function usePortfolioMetrics(userId: string | null) {
  const [state, setState] = useState<UsePortfolioMetricsState>({
    metrics: null,
    sites: [],
    loading: false,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    if (!userId) {
      setState({
        metrics: null,
        sites: [],
        loading: false,
        error: "User ID required",
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/portfolio/metrics?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();

      setState({
        metrics: data.metrics,
        sites: data.sites || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: String(error),
      }));
    }
  }, [userId]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    ...state,
    refetch: fetchMetrics,
  };
}
