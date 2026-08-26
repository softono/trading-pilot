"use client";

import { useAuth } from "@/context/AuthContext";
import { ProfileDropdown as SharedProfileDropdown } from "@/components/common/ProfileDropdown";

export function ProfileDropdown() {
  const { user, logout } = useAuth();

  return (
    <SharedProfileDropdown
      user={user}
      accountHref="/account/update"
      onLogout={() => {
        logout();
        window.location.href = "/login";
      }}
    />
  );
}
