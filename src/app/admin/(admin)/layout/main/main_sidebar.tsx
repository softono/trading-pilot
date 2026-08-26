"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileX,
  Lock,
  Bell,
  Settings,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  LogOut,
  ServerOff,
  Newspaper,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import config from "@/config";
import { NavGroup, type NavGroupProps } from "./nav-group";
import { NavUser } from "./nav-user";
import { useAuth } from "@/context/AdminAuthContext";
import { getFileUrl } from "@/utils/fileurl";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}
function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/`;
}

export type Collapsible = "offcanvas" | "icon" | "none";
export type Variant = "inset" | "sidebar" | "floating";

const LAYOUT_COLLAPSIBLE_COOKIE_NAME = "layout_collapsible";
const LAYOUT_VARIANT_COOKIE_NAME = "layout_variant";
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const DEFAULT_VARIANT = "inset";
const DEFAULT_COLLAPSIBLE = "icon";

type LayoutContextType = {
  resetLayout: () => void;
  defaultCollapsible: Collapsible;
  collapsible: Collapsible;
  setCollapsible: (collapsible: Collapsible) => void;
  defaultVariant: Variant;
  variant: Variant;
  setVariant: (variant: Variant) => void;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

type LayoutProviderProps = {
  children: React.ReactNode;
};

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [collapsible, _setCollapsible] = useState<Collapsible>(() => {
    const saved = getCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME);
    return (saved as Collapsible) || DEFAULT_COLLAPSIBLE;
  });

  const [variant, _setVariant] = useState<Variant>(() => {
    const saved = getCookie(LAYOUT_VARIANT_COOKIE_NAME);
    return (saved as Variant) || DEFAULT_VARIANT;
  });

  const setCollapsible = (newCollapsible: Collapsible) => {
    _setCollapsible(newCollapsible);
    setCookie(
      LAYOUT_COLLAPSIBLE_COOKIE_NAME,
      newCollapsible,
      LAYOUT_COOKIE_MAX_AGE,
    );
  };

  const setVariant = (newVariant: Variant) => {
    _setVariant(newVariant);
    setCookie(LAYOUT_VARIANT_COOKIE_NAME, newVariant, LAYOUT_COOKIE_MAX_AGE);
  };

  const resetLayout = () => {
    setCollapsible(DEFAULT_COLLAPSIBLE);
    setVariant(DEFAULT_VARIANT);
  };

  const contextValue: LayoutContextType = {
    resetLayout,
    defaultCollapsible: DEFAULT_COLLAPSIBLE,
    collapsible,
    setCollapsible,
    defaultVariant: DEFAULT_VARIANT,
    variant,
    setVariant,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

type SidebarData = {
  navGroups: NavGroupProps[];
};

// type NavItem removed (unused)

const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: LayoutDashboard,
          permission: null, // Always visible
        },
        {
          title: "Users",
          url: "/admin/users",
          icon: Users,
          permission: "admin/user", // Direct permission for users list
        },
        {
          title: "Blogs",
          url: "/admin/blogs",
          icon: Newspaper,
          permission: "admin/blog", // Direct permission for blogs list
        },
        {
          title: "Analyst Applications",
          url: "/admin/analyst-applications",
          icon: UserCheck,
          permission: "admin/analyst-application",
        },
        {
          title: "Analysts",
          url: "/admin/analysts",
          icon: TrendingUp,
          permission: "admin/analyst",
        },
        {
          title: "Setting",
          url: "/admin/settings",
          icon: Settings,
          permission: null, // Show if any setting-related permission exists
          items: [
            {
              title: "Setting",
              url: "/admin/settings",
              icon: UserCog,
              permission: "admin/setting/update",
            },
            {
              title: "Admin",
              url: "/admin/admins",
              icon: UserX,
              permission: "admin/admin",
            },
            {
              title: "Seo",
              url: "/admin/seos",
              icon: ServerOff,
              permission: "admin/seo",
            },
            {
              title: "Session",
              url: "/admin/sessions",
              icon: Lock,
              permission: "admin/session",
            },
            {
              title: "Activity",
              url: "/admin/activities",
              icon: Bell,
              permission: "admin/activity",
            },
            {
              title: "Pages",
              url: "/admin/pages",
              icon: FileX,
              permission: "admin/page",
            },
            {
              title: "Email Template",
              url: "/admin/email-templates",
              icon: MessagesSquare,
              permission: "admin/email_template",
            },
          ],
        },
        {
          title: "Logout",
          url: "/admin/logout",
          icon: LogOut,
          permission: null, // Always visible
        },
      ],
    },
  ],
};

export function AppSidebar() {
  const { collapsible, variant } = useLayout();
  const { user } = useAuth();

  const userData = user
    ? {
        fullName:
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User",
        email: user.email || "",
        avatar: user?.image || "",
      }
    : {
        fullName: "User",
        email: "",
        avatar: "",
      };

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <button
            className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Image
                src={getFileUrl(config.APP_LOGO)}
                alt="App Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain rounded-lg"
                unoptimized
              />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{config.APP_NAME} </span>
            </div>
          </button>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup
            key={`${props.title}-${user?.permission || "no-permission"}-${user?.role || "no-role"}`}
            {...props}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
