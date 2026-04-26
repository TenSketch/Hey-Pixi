"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, BarChart3, Bot } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

export function MobileNav({ user }: { user: Record<string, unknown> | null | undefined }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Activity, exact: true },
    { href: "/dashboard/bots", label: "AI Agents", icon: Bot, exact: false },
    { href: "/dashboard/leads", label: "Leads", icon: BarChart3, exact: false },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-40 px-4 pb-safe">
      {navItems.map((item) => {
        const isActive = item.exact 
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
              isActive ? "text-brand" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}

      <div className="flex flex-col items-center justify-center w-16 h-full gap-1">
        <SignOutButton />
        <span className="text-[10px] font-medium text-slate-500">Exit</span>
      </div>
    </div>
  );
}
