"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Plus, Workflow, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Whether the current path should highlight this item. */
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    Icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/leads/history",
    label: "Leads",
    Icon: ListChecks,
    // Saved lead detail pages belong to "Leads"; new/analysis are the create flow.
    isActive: (pathname) =>
      pathname.startsWith("/leads") &&
      !pathname.startsWith("/leads/new") &&
      !pathname.startsWith("/leads/analysis"),
  },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Workflow className="size-4" aria-hidden="true" />
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight">LeadFlow</span>
    </Link>
  );
}

function NavLinks({ pathname, orientation }: { pathname: string; orientation: "vertical" | "horizontal" }) {
  return (
    <ul className={cn("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row")}>
      {NAV_ITEMS.map(({ href, label, Icon, isActive }) => {
        const active = isActive(pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NewLeadLink({ className }: { className?: string }) {
  return (
    <Link href="/leads/new" className={cn(buttonVariants({ variant: "primary", size: "md" }), className)}>
      <Plus aria-hidden="true" />
      New Lead
    </Link>
  );
}

/** One shell for every screen: sidebar on desktop, compact top bar below `lg`. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-border bg-surface lg:flex lg:flex-col lg:gap-6 lg:p-4">
        <div className="px-1 pt-1">
          <Brand />
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-4">
          <NewLeadLink className="w-full" />
          <NavLinks pathname={pathname} orientation="vertical" />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Two rows so brand, nav and the CTA never exceed a 375px viewport. */}
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <Brand />
            <NewLeadLink className="h-9 px-3" />
          </div>
          <nav aria-label="Primary" className="px-3 pb-2">
            <NavLinks pathname={pathname} orientation="horizontal" />
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
