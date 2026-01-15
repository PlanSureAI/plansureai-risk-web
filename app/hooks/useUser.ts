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
      const sessionUser = session.user as typeof session.user & {
        id?: string;
        plan_tier?: User["plan_tier"];
      };
      setState({
        user: {
          id: sessionUser.id || "",
          email: sessionUser.email || "",
          name: sessionUser.name || "",
          avatar_url: sessionUser.image || undefined,
          plan_tier: sessionUser.plan_tier || "free",
        },
        loading: false,
        error: null,
      });
    }
  }, [session, status]);

  return state;
}
