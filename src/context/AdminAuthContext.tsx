"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { create } from "zustand";
import { authClient } from "@/lib/authClient";
import { ADMIN_ROLES, USER_ROLES } from "@/modules/account/user.constants";
import { hasPermission } from "@/modules/account/permission";
import type { IUser } from "@/modules/account/user.types";

interface AdminAuthState {
  user: IUser | null;
  loading: boolean;
  login: (user: IUser) => void;
  logout: () => void;
  updateUser: (user: IUser) => void;
  hasPermission: (permission: string) => boolean;
}

const LAST_ACTIVITY_KEY = "last_activity";
const INACTIVITY_TIMEOUT = 120 * 60 * 1000;
const ACTIVITY_THROTTLE = 30 * 1000;

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let lastActivityWrite = 0;

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(
    () => useAdminAuthStore.getState().logout(),
    INACTIVITY_TIMEOUT,
  );
  const now = Date.now();
  if (now - lastActivityWrite > ACTIVITY_THROTTLE) {
    lastActivityWrite = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  }
}

async function clearSessionAndRecheck() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  try {
    await authClient.signOut();
  } catch {}
  // Cookie is now cleared — reload the current path so the proxy re-evaluates
  // and emits the canonical ?redirect= when routing to login.
  window.location.href = window.location.pathname;
}

export const useAdminAuthStore = create<AdminAuthState>()((set, get) => ({
  user: null,
  loading: true,
  login: (user) => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    set({ user });
    resetInactivityTimer();
  },
  logout: async () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    try {
      await authClient.signOut();
    } catch {}
    window.location.href = "/admin/auth/login";
  },
  updateUser: (user) => set({ user }),
  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === USER_ROLES.SUPER_ADMIN) return true;
    return hasPermission(permission, user.permission ?? "");
  },
}));

async function initSession() {
  const isAuthPage = window.location.pathname.startsWith("/admin/auth");
  try {
    const res = await authClient.getSession();
    const user = res.data?.user as IUser | undefined;

    const isAdmin =
      user && (ADMIN_ROLES as readonly string[]).includes(user.role || "");
    if (!user || !isAdmin) {
      if (!isAuthPage) clearSessionAndRecheck();
      return;
    }

    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (
      storedLastActivity &&
      Date.now() - parseInt(storedLastActivity) > INACTIVITY_TIMEOUT
    ) {
      useAdminAuthStore.getState().logout();
      return;
    }

    useAdminAuthStore.setState({ user });
    resetInactivityTimer();
  } catch {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (!isAuthPage) clearSessionAndRecheck();
  } finally {
    useAdminAuthStore.setState({ loading: false });
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const user = useAdminAuthStore((s) => s.user);

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleActivity = () => resetInactivityTimer();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [user]);

  return <>{children}</>;
};

export const useAuth = () => {
  const store = useAdminAuthStore();
  return { ...store, isAuthenticated: !!store.user };
};
