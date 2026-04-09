"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group"
      title="Sign Out"
    >
      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
    </button>
  );
}
