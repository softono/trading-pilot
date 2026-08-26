"use client";

import React, { useEffect } from "react";
import { create } from "zustand";
import { authClient } from "@/lib/authClient";

export interface IUser {
  id: string;
  email: string;
  image?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  country?: string | null;
  timezone?: string | null;
  role?: string | null;
  status?: number | null;
  email_verified?: boolean;
  two_factor_enabled?: boolean | null;
  permission?: string | null;
  created_at?: Date | string | null;
}

interface AuthState {
  user: IUser | null;
  loading: boolean;
  login: (user?: IUser | null) => void;
  logout: () => void;
  updateUser: (user: IUser) => void;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  login: (user) => {
    if (user) set({ user });
  },
  logout: async () => {
    try {
      await authClient.signOut();
    } catch {}
    window.location.href = "/login";
  },
  updateUser: (user) => set({ user }),
  refreshSession: async () => {
    try {
      const res = await authClient.getSession();
      set({ user: (res.data?.user as IUser) ?? null });
    } catch {
      set({ user: null });
    }
  },
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      useAuthStore.setState({ loading: false });
      return;
    }
    useAuthStore
      .getState()
      .refreshSession()
      .finally(() => useAuthStore.setState({ loading: false }));
  }, []);

  return <>{children}</>;
}

export function useAuth() {
  const store = useAuthStore();
  return { ...store, isAuthenticated: Boolean(store.user) };
}
