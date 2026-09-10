"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { clearTokens, isAuthenticated, setTokens } from "@/lib/auth";
import { AuthContext } from "@/hooks/use-auth";
import type { AuthResponse, RegisterRequest, User } from "@/lib/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.get<User>("/auth/profile");
        if (active) setUser(profile);
      } catch {
        // The api client attempts one token refresh on 401; if that fails it
        // clears the session and redirects to /login. Clear locally too.
        if (active) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const login = React.useCallback(
    async (email: string, password: string): Promise<User> => {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setUser(response.user);
      return response.user;
    },
    []
  );

  const register = React.useCallback(
    async (data: RegisterRequest): Promise<User> => {
      await api.post<User>("/auth/register", data);
      // Register returns only the profile; sign in immediately so the new
      // session has tokens and the UI can switch to the logged-in state.
      const response = await api.post<AuthResponse>("/auth/login", {
        email: data.email,
        password: data.password,
      });
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setUser(response.user);
      return response.user;
    },
    []
  );

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await api.post<void>("/auth/logout");
    } catch {
      // Best-effort server-side invalidation; clear locally regardless.
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}