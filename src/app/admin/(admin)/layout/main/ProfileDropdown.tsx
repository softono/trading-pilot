"use client";

import { useAuth } from "@/context/AdminAuthContext";
import { useRouter } from "next/navigation";
import { ProfileDropdown as SharedProfileDropdown } from "@/components/common/ProfileDropdown";
import { Settings, UserIcon } from "lucide-react";

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <SharedProfileDropdown
      user={user}
      accountHref="/admin/account/update"
      menuItems={[
        {
          href: "/admin/account/update",
          label: "My Account",
          icon: <UserIcon />,
        },
        { href: "/admin/settings", label: "Settings", icon: <Settings /> },
      ]}
      onLogout={() => {
        logout();
        router.push("/");
      }}
    />
  );
}
