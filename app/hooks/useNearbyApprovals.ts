import { useState, useCallback } from "react";
import { PlanningApproval } from "@/app/types";

interface UseNearbyApprovalsState {
  approvals: PlanningApproval[];
  loading: boolean;
  error: string | null;
  count: number;
}

export function useNearbyApprovals() {
  const [state, setState] = useState<UseNearbyApprovalsState>({
    approvals: [],
    loading: false,
    error: null,
    count: 0,
  });

  const fetchApprovals = useCallback(
    async (siteId: string, radiusKm: number = 0.5) => {
      setState({ approvals: [], loading: true, error: null, count: 0 });

      try {
        const response = await fetch(
          `/api/approvals/nearby?siteId=${siteId}&radiusKm=${radiusKm}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch approvals: ${response.statusText}`);
        }

        const data = await response.json();

        setState({
          approvals: data.approvals || [],
          loading: false,
          error: null,
          count: data.count || 0,
        });

        return data.approvals;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: String(error),
        }));
        throw error;
      }
    },
    []
  );

  return {
    ...state,
    fetchApprovals,
  };
}
