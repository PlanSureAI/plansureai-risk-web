import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status } = useSession();

  const login = useCallback(async (email: string, password: string) => {
    return signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  }, []);

  const logout = useCallback(async () => {
    return signOut({ redirect: false });
  }, []);

  const loginWithOAuth = useCallback(async (provider: "google" | "github") => {
    return signIn(provider, { redirect: true });
  }, []);

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    session,
    login,
    logout,
    loginWithOAuth,
  };
}
