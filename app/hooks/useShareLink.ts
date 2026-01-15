import { useState, useCallback } from "react";
import { ShareLink } from "@/app/types";

interface UseShareLinkState {
  share: ShareLink | null;
  loading: boolean;
  error: string | null;
  shareUrl: string | null;
}

export function useShareLink() {
  const [state, setState] = useState<UseShareLinkState>({
    share: null,
    loading: false,
    error: null,
    shareUrl: null,
  });

  const createShare = useCallback(
    async (siteId: string, expiresInDays: number = 30, recipientEmail?: string) => {
      setState({ share: null, loading: true, error: null, shareUrl: null });

      try {
        const response = await fetch("/api/shares/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            expiresInDays,
            recipientEmail,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create share: ${response.statusText}`);
        }

        const data = await response.json();

        setState({
          share: data,
          loading: false,
          error: null,
          shareUrl: data.shareUrl,
        });

        return data;
      } catch (error) {
        const errorMsg = String(error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        throw error;
      }
    },
    []
  );

  const copyToClipboard = useCallback(() => {
    if (state.shareUrl) {
      navigator.clipboard.writeText(state.shareUrl);
      return true;
    }
    return false;
  }, [state.shareUrl]);

  return {
    ...state,
    createShare,
    copyToClipboard,
  };
}
