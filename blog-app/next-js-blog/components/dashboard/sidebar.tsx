"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  CreditCard,
  FileText,
  Home,
  ShieldCheck,
  Tags,
  PenLine,
} from "lucide-react";

const baseNavItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/posts", label: "Posts", icon: FileText },
  { href: "/dashboard/pricing", label: "Plans & Pricing", icon: CreditCard },
];

interface DashboardSidebarProps {
  canManageTags: boolean;
  canManageUsers: boolean;
}

export function DashboardSidebar({
  canManageTags,
  canManageUsers,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = [...baseNavItems];

  if (canManageTags) {
    navItems.push({ href: "/dashboard/tags", label: "Tags", icon: Tags });
  }

  if (canManageUsers) {
    navItems.push({
      href: "/dashboard/presence",
      label: "Online Users",
      icon: Activity,
    });
    navItems.push({
      href: "/dashboard/users",
      label: "Role Permissions",
      icon: ShieldCheck,
    });
  }

  return (
    <aside className="hidden w-64 border-r bg-card md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <PenLine className="h-5 w-5" />
        <Link href="/" className="text-lg font-bold">
          Blog App
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
