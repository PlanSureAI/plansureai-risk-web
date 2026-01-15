import { useState, useCallback } from "react";
import { PreAppPack } from "@/app/types";

interface UsePreAppPackState {
  pack: PreAppPack | null;
  loading: boolean;
  error: string | null;
}

export function usePreAppPack() {
  const [state, setState] = useState<UsePreAppPackState>({
    pack: null,
    loading: false,
    error: null,
  });

  const generatePack = useCallback(async (siteId: string) => {
    setState({ pack: null, loading: true, error: null });

    try {
      const response = await fetch("/api/preapp/generate-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate pack: ${response.statusText}`);
      }

      const data = await response.json();

      setState({
        pack: data.pack || data,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: String(error),
      }));
      throw error;
    }
  }, []);

  const downloadPack = useCallback(async (packId: string) => {
    try {
      const response = await fetch(`/api/preapp/generate-pack?packId=${packId}`);

      if (!response.ok) {
        throw new Error("Failed to download pack");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pre-app-pack-${packId}.pdf`;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }, []);

  return {
    ...state,
    generatePack,
    downloadPack,
  };
}
