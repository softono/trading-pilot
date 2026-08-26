"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Menu, X, User, Power, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ThemeSwitcher } from "@/components/switchcn";
import { useRouter } from "next/navigation";
import { ProfileDropdown } from "@/modules/account/ProfileDropdown";
import { Button } from "@/components/ui/button";
import config from "@/config";
import { getFileUrl } from "@/utils/fileurl";

type NavLink = {
  title: string;
  href: string;
  isActive: boolean;
};

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  navLinks?: NavLink[];
};

export function Header({
  className,
  fixed = true,
  navLinks = [],
  children,
  ...props
}: HeaderProps) {
  const [, setOffset] = useState(0);
  const [, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setOffset(scrollTop);
      setProgress(scrollPercent);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
    setOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-background"></div>

      {fixed && (
        <div className="fixed top-1 left-0 w-full h-4 z-40 bg-background" />
      )}

      <header
        className={cn(
          "h-16 md:w-[calc(100%-78px)] w-full px-8 flex items-center z-50 ",
          fixed && "fixed top-4 left-1/2 -translate-x-1/2  px-4 ",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between w-full bg-background  h-full rounded-md  px-6 shadow-sm border">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between w-full gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src={getFileUrl(config.APP_LOGO)}
                alt={config.APP_NAME}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-contain"
                unoptimized
              />
            </Link>

            <span className="font-bold text-[23px] text-foreground">
              {config.APP_NAME}
            </span>

            {children}

            <div className="ms-auto flex items-center space-x-4">
              <ThemeSwitcher />
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <>
                  <Link href="/login">
                    <Button className="flex rounded-full items-center gap-2">
                      Login
                      <LogIn size={16} />
                    </Button>
                  </Link>

                  <Link href="/register">
                    <Button className="flex rounded-full items-center gap-2">
                      Register
                      <UserPlus size={16} />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-between w-full gap-3 relative">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={config.APP_LOGO}
                  alt={config.APP_NAME}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-contain"
                  unoptimized
                />
              </Link>
              <span className="font-bold text-lg text-foreground">
                {config.APP_NAME}
              </span>
            </div>

            <button
              onClick={() => setOpen(!open)}
              suppressHydrationWarning={true}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-48 bg-background border rounded-lg shadow-lg">
                <ul className="flex flex-col py-2">
                  {navLinks
                    .filter((l) => l.isActive)
                    .map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block px-4 py-2 hover:bg-accent"
                          onClick={() => setOpen(false)}
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}

                  <li className="px-4 py-2">
                    <ThemeSwitcher />
                  </li>

                  {isAuthenticated ? (
                    <>
                      <li className="border-t mt-1">
                        <Link
                          href="/account/update"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
                          onClick={() => setOpen(false)}
                        >
                          <div className="relative h-6 w-6">
                            <User className="h-full w-full" />
                            <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-green-500 border border-white" />
                          </div>
                          My Account
                        </Link>
                      </li>

                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 w-full text-left text-red-700"
                        >
                          <Power /> Log Out
                        </button>
                      </li>
                    </>
                  ) : (
                    <li className="border-t mt-1">
                      <Link
                        href="/login"
                        className="block px-4 py-2 hover:bg-accent"
                        onClick={() => setOpen(false)}
                      >
                        Login
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
