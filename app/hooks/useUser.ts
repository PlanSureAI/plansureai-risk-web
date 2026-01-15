import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  plan_tier: "free" | "starter" | "pro" | "enterprise";
}

interface UseUserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useUser() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<UseUserState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setState({
        user: null,
        loading: false,
        error: "Not authenticated",
      });
      return;
    }

    if (session?.user) {
      setState({
        user: {
          id: session.user.id || "",
          email: session.user.email || "",
          name: session.user.name || "",
          avatar_url: session.user.image,
          plan_tier: (session.user.plan_tier as any) || "free",
        },
        loading: false,
        error: null,
      });
    }
  }, [session, status]);

  return state;
}
