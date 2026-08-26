import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Monitor, Lock, User, Key, History, Fingerprint } from "lucide-react";

const navItems = (basePath: string) => [
  {
    title: "Account",
    href: `${basePath}/account/update`,
    icon: <User size={18} />,
  },
  {
    title: "Password Change",
    href: `${basePath}/account/password-change`,
    icon: <Key size={18} className="rotate-45" />,
  },
  {
    title: "Two Factor Authentication",
    href: `${basePath}/account/tfa`,
    icon: <Lock size={18} />,
  },
  {
    title: "Passkeys",
    href: `${basePath}/account/passkeys`,
    icon: <Fingerprint size={18} />,
  },
  {
    title: "Sessions",
    href: `${basePath}/account/session`,
    icon: <Monitor size={18} />,
  },
  {
    title: "Activity",
    href: `${basePath}/account/user_activity`,
    icon: <History size={18} />,
  },
];

export function AccountBlock({
  activeTab,
  basePath = "",
}: {
  activeTab?: string;
  basePath?: string;
}) {
  return (
    <div className="mb-6 w-full justify-start sm:px-10">
      <SidebarNav items={navItems(basePath)} activeTab={activeTab} />
    </div>
  );
}
