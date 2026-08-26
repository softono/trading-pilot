"use client";

import { useAuth } from "@/context/AdminAuthContext";
import { ThemeSwitcher } from "@/components/switchcn";
import { ProfileDropdown } from "./ProfileDropdown";
import { NavUser } from "./nav-user";
import config from "@/config";

// AppHeader component to provide navbar UI for main layout
export function AppHeader() {
  const { user } = useAuth();

  const avatarUrl = user?.image
    ? user.image.startsWith("http")
      ? user.image
      : `${(config.BASE_URL || "").replace(/\/$/, "")}/profile/${user.image}`
    : "";

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-background border-b">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">Admin Panel</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <ProfileDropdown />
        {user && (
          <NavUser
            user={{
              fullName: `${user.first_name} ${user.last_name}`.trim() || "User",
              email: user.email || "",
              avatar: avatarUrl,
            }}
          />
        )}
      </div>
    </header>
  );
}

// Re-export types and components for convenience
export {
  NavGroup,
  type NavItem,
  type NavGroupProps,
  type NavLink,
  type NavCollapsible,
} from "./nav-group";
