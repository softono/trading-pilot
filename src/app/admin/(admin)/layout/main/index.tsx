import { type HTMLAttributes, type PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar, LayoutProvider } from "./main_sidebar";
import { ThemeSwitcher } from "@/components/switchcn";
import { ProfileDropdown } from "./ProfileDropdown";

type HeaderProps = HTMLAttributes<HTMLElement>;

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header className={cn("z-50 h-16", className)} {...props}>
      <div className="relative flex h-full items-center gap-3 p-4 sm:gap-4">
        <SidebarTrigger variant="outline" className="max-md:scale-125" />
        <Separator orientation="vertical" className="h-6" />
        {children}
      </div>
    </header>
  );
}

type MainProps = HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  fluid?: boolean;
};

export function Main({ fixed, className, fluid, ...props }: MainProps) {
  return (
    <main
      data-layout={fixed ? "fixed" : "auto"}
      className={cn(
        "px-4 py-6",
        fixed && "flex grow flex-col overflow-hidden",
        !fluid &&
          "@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}

type AuthenticatedLayoutProps = PropsWithChildren;

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset
          className={cn(
            "@container/content",
            "has-data-[layout=fixed]:h-svh",
            "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]",
          )}
        >
          <Header>
            {/* <TopNav links={topNavLinks} /> */}
            <div className="ms-auto flex items-center space-x-4">
              {/* <Search /> */}
              <ThemeSwitcher />
              {/* <ConfigDrawer /> */}
              <ProfileDropdown />
            </div>
          </Header>
          <Main>{children}</Main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  );
}
