"use client";

import {
  Bell,
  BookOpen,
  Building2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Alerts", icon: Bell },
  { href: "/competitors", label: "Competitors", icon: Building2 },
  { href: "/digests", label: "Digests", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col border-b border-border bg-sidebar md:h-svh md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-4 py-3 md:px-4 md:py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
          LW
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            Launch Watcher
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Competitive intel
          </p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-2 md:pb-0">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
