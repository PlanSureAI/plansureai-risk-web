import { useState, useEffect, useCallback } from "react";

export interface AlertSubscription {
  id: string;
  alert_type: "new_applications" | "policy_changes" | "deadline_alerts";
  frequency: "daily" | "weekly" | "monthly";
  regions: string[];
  email: string;
  enabled: boolean;
}

interface UseEmailAlertsState {
  alerts: AlertSubscription[];
  loading: boolean;
  error: string | null;
}

export function useEmailAlerts(userId: string | null) {
  const [state, setState] = useState<UseEmailAlertsState>({
    alerts: [],
    loading: false,
    error: null,
  });

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`/api/alerts/schedule?userId=${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      setState({
        alerts: data.alerts || [],
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
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(
    async (
      alertType: string,
      frequency: string,
      regions: string[],
      email: string
    ) => {
      try {
        const response = await fetch("/api/alerts/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            alertType,
            frequency,
            regions,
            email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create alert");
        }

        await fetchAlerts();
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    [userId, fetchAlerts]
  );

  const deleteAlert = useCallback(
    async (alertId: string) => {
      try {
        const response = await fetch(`/api/alerts/schedule?alertId=${alertId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete alert");
        }

        await fetchAlerts();
      } catch (error) {
        throw error;
      }
    },
    [fetchAlerts]
  );

  return {
    ...state,
    fetchAlerts,
    createAlert,
    deleteAlert,
  };
}
