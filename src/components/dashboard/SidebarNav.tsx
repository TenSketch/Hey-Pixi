"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, BarChart3, Bot } from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Activity, exact: true },
    { href: "/dashboard/bots", label: "AI Agents", icon: Bot, exact: false },
    { href: "/dashboard/leads", label: "Leads CRM", icon: BarChart3, exact: false },
  ];

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => {
        // Active logic: 
        // 1. If exact is true, path must match exactly (or be a sub-route of bots which is logically under overview)
        // 2. Otherwise, check if path starts with href
        const isActive = item.exact 
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium group",
              isActive 
                ? "text-brand bg-brand-light/80 font-bold border-l-4 border-brand rounded-l-none -ml-4 pl-6" 
                : "text-slate-600 hover:text-brand hover:bg-brand-light/40"
            )}
          >
            <item.icon className={cn(
                "w-4 h-4 transition-transform",
                isActive ? "scale-110" : "group-hover:scale-110"
            )} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
