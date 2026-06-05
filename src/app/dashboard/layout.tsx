import { auth } from "@/auth";
import Link from "next/link";
import { Bot, User as UserIcon } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { WorkspaceSwitcher, type WorkspaceOption } from "@/components/dashboard/WorkspaceSwitcher";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { cookies } from "next/headers";

const WORKSPACE_COOKIE = "activeWorkspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let workspaces: WorkspaceOption[] = [];
  let activeWorkspaceId = "personal";

  if (session?.user?.email) {
    await dbConnect();
    
    const db = mongoose.connection.db;
    if (db) {
      const usersCol = db.collection("users");
      const invitesCol = db.collection("projectinvites");
      
      const dbUser = await usersCol.findOne({ email: session.user.email });
      if (dbUser) {
        // Self-heal legacy database entries
        const fieldsToSet: Record<string, unknown> = {};
        if (!dbUser.role) fieldsToSet.role = "admin";
        if (dbUser.tokenUsage === undefined) fieldsToSet.tokenUsage = 0;
        if (!dbUser.tokenLimit) fieldsToSet.tokenLimit = 100;
        if (!dbUser.subscriptionPlan) fieldsToSet.subscriptionPlan = "free";
        if (!dbUser.subscriptionStatus) fieldsToSet.subscriptionStatus = "active";

        // Check for workspace invitation if they don't have a parentId yet
        if (!dbUser.parentId) {
          const pendingInvite = await invitesCol.findOne({
            email: (dbUser.email as string).toLowerCase().trim(),
            status: { $in: ["pending", "accepted"] },
          });
          if (pendingInvite) {
            fieldsToSet.parentId = pendingInvite.ownerId;
            fieldsToSet.role = pendingInvite.role;
            await invitesCol.updateOne(
              { _id: pendingInvite._id },
              { $set: { status: "accepted" } }
            );
            console.log(`[Invites] Applied pending invite for ${dbUser.email} -> Role: ${pendingInvite.role}, Workspace owner: ${pendingInvite.ownerId}`);
          }
        }

        if (Object.keys(fieldsToSet).length > 0) {
          await usersCol.updateOne({ _id: dbUser._id }, { $set: fieldsToSet });
          Object.assign(dbUser, fieldsToSet);
        }

        // Build workspace options
        workspaces.push({
          id: "personal",
          label: "Personal Workspace",
          sublabel: `${dbUser.name || "My"}'s own bots & data`,
          isPersonal: true,
        });

        // If user is invited to another workspace, add that option
        const effectiveParentId = dbUser.parentId;
        if (effectiveParentId) {
          try {
            const ownerObjectId = typeof effectiveParentId === "string" 
              ? new mongoose.Types.ObjectId(effectiveParentId) 
              : effectiveParentId;

            const ownerUser = await usersCol.findOne({ _id: ownerObjectId });
            if (ownerUser) {
              workspaces.push({
                id: effectiveParentId.toString(),
                label: `${ownerUser.name}'s Workspace`,
                sublabel: `Role: ${(dbUser.role as string || "viewer").charAt(0).toUpperCase() + (dbUser.role as string || "viewer").slice(1)}`,
                isPersonal: false,
              });
            }
          } catch (e) {
            console.error("Invalid effectiveParentId:", e);
          }
        }

        // Read cookie to determine active workspace
        const cookieStore = await cookies();
        const cookiePref = cookieStore.get(WORKSPACE_COOKIE)?.value;
        
        if (cookiePref && cookiePref !== "personal" && effectiveParentId && cookiePref === effectiveParentId.toString()) {
          activeWorkspaceId = cookiePref;
        } else if (!cookiePref && effectiveParentId) {
          // Default: if user has a parentId and no cookie set, default to invited workspace
          activeWorkspaceId = effectiveParentId.toString();
        } else {
          activeWorkspaceId = "personal";
        }
      }
    }
  }

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

        {/* Workspace Switcher */}
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
        />

        <SidebarNav />

        <div className="p-4 border-t border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon size={16} />
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
      <MobileNav />
    </div>
  );
}
