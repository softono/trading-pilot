"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { UserIcon, Power } from "lucide-react";
import type { IUser } from "@/modules/account/user.types";

const getImageUrl = (image: string | null | undefined) => {
  if (!image) return undefined;
  if (image.startsWith("http")) return image;
  if (image.startsWith("/upload/profile/")) return image;
  if (image.startsWith("/profile/")) return image;
  return "/upload/profile/" + image;
};

export interface ProfileMenuItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  user: IUser | null;
  onLogout: () => void;
  accountHref: string;
  menuItems?: ProfileMenuItem[];
}

// Context-free: callers pass user/onLogout from their own auth context
// (AuthContext or AdminAuthContext) so this stays shared between the
// public header and the admin navbar.
export function ProfileDropdown({
  user,
  onLogout,
  accountHref,
  menuItems,
}: Props) {
  const [open, setOpen] = useState(false);

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User"
    : "User";
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
        .trim()
        .slice(0, 2)
        .toUpperCase() || "U"
    : "U";

  const items: ProfileMenuItem[] = menuItems ?? [
    { href: accountHref, label: "My Account", icon: <UserIcon /> },
  ];

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
            <div className="relative h-full w-full">
              <Avatar className="h-full w-full">
                {user?.image ? (
                  <AvatarImage
                    src={getImageUrl(user?.image)}
                    alt={displayName}
                  />
                ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
                )}
              </Avatar>

              {/* Dot inside avatar */}
              <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-green-500 border border-white" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <Link href={accountHref}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {user?.image ? (
                    <AvatarImage
                      src={getImageUrl(user?.image)}
                      alt={displayName}
                    />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </Link>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {items.map((item) => (
              <DropdownMenuItem asChild key={item.href}>
                <Link href={item.href}>
                  {item.icon} {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            <Power /> Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        open={!!open}
        onOpenChange={setOpen}
        title="Log Out"
        description="Are you sure you want to Log out? You will need to login again to access your account."
        confirmText="Log Out"
        onConfirm={onLogout}
        destructive
      />
    </>
  );
}
