import { useState, useCallback } from "react";
import { RiskAssessment } from "@/app/types";

interface UseRiskScoreState {
  assessment: RiskAssessment | null;
  loading: boolean;
  error: string | null;
}

export function useRiskScore() {
  const [state, setState] = useState<UseRiskScoreState>({
    assessment: null,
    loading: false,
    error: null,
  });

  const calculateRisk = useCallback(async (siteId: string) => {
    setState({ assessment: null, loading: true, error: null });

    try {
      const response = await fetch("/api/risk/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });

      if (!response.ok) {
        throw new Error(`Risk calculation failed: ${response.statusText}`);
      }

      const data = await response.json();

      setState({
        assessment: data.assessment,
        loading: false,
        error: null,
      });

      return data.assessment;
    } catch (error) {
      const errorMessage = String(error);
      setState({
        assessment: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    calculateRisk,
  };
}
