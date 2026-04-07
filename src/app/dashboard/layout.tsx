import { auth } from "@/auth";
import Link from "next/link";
import { Bot, BarChart3, Ticket, Activity, User } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-brand text-white p-1.5 rounded-lg shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">HeyPixi</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-700 bg-slate-100 rounded-lg hover:text-brand hover:bg-brand-light/50 transition-colors font-medium">
            <Activity className="w-4 h-4" />
            Overview
          </Link>
          <Link href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:text-brand hover:bg-brand-light/50 transition-colors font-medium">
            <BarChart3 className="w-4 h-4" />
            Leads CRM
          </Link>
          <Link href="/dashboard/tickets" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:text-brand hover:bg-brand-light/50 transition-colors font-medium">
            <Ticket className="w-4 h-4" />
            Tickets
          </Link>
        </nav>

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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between">
            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
