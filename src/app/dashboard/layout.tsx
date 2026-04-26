import { auth } from "@/auth";
import Link from "next/link";
import { Bot, User } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-brand text-white p-1.5 rounded-lg shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">HeyPixi</span>
          </Link>
        </div>

        <SidebarNav />

        <div className="p-4 border-t border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <User size={16} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
            <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 relative z-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav user={session?.user} />
    </div>
  );
}
