"use client";

import { useState, useEffect } from "react";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { inviteTeamMember, removeTeamMember, revokeInvite, getTeamData } from "@/lib/actions/team-actions";
import { toast } from "sonner";
import { User, Mail, Shield, ShieldCheck, Sparkles, RefreshCw, Eye, Users, UserPlus, Trash2, Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ProfileClientProps {
  user: Record<string, any>;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const isRootAdmin = !user.parentId && user.role === "admin";
  const isChildMember = !!user.parentId;

  const [teamData, setTeamData] = useState<{
    members: Array<{ _id: string; name: string; email: string; role: string; createdAt?: string }>;
    invites: Array<{ _id: string; email: string; role: string; status: string; createdAt?: string }>;
    currentUserRole: string;
    isRootAdmin: boolean;
  } | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "viewer">("manager");
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const res = await getTeamData();
      if (res.success) {
        setTeamData(res as any);
      } else {
        toast.error("Failed to load team data", { description: res.error });
      }
    } catch {
      toast.error("Failed to fetch team members");
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setInviteLoading(true);
    try {
      const res = await inviteTeamMember(email, inviteRole);
      if (res.success) {
        toast.success("Workspace Invite Sent!", { description: res.message });
        setInviteEmail("");
        fetchTeam();
      } else {
        toast.error("Invitation failed", { description: res.error });
      }
    } catch {
      toast.error("An error occurred while sending the invite.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your workspace? They will lose shared access immediately.`)) {
      return;
    }

    try {
      const res = await removeTeamMember(memberId);
      if (res.success) {
        toast.success("Removed team member successfully.");
        fetchTeam();
      } else {
        toast.error("Failed to remove member", { description: res.error });
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleRevokeInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke the pending invitation for ${email}?`)) {
      return;
    }

    try {
      const res = await revokeInvite(inviteId);
      if (res.success) {
        toast.success("Revoked invitation successfully.");
        fetchTeam();
      } else {
        toast.error("Failed to revoke invite", { description: res.error });
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "manager":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "viewer":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h2>
        <p className="text-slate-500 mt-1">Manage your account information, workspace team members, and recurring subscriptions.</p>
      </div>

      {/* Workspace Context Banner for Invited Members */}
      {isChildMember && user.ownerInfo && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Crown size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900">
              You are a member of <span className="text-indigo-600">{user.ownerInfo.name}&apos;s</span> workspace
            </p>
            <p className="text-xs text-indigo-600">
              Your role: <span className="font-bold uppercase">{user.role}</span> — You share access to all bots, leads, and resources managed by the workspace admin.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Details & Workspace Team */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Details Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
              <User className="text-slate-400" size={20} />
              Account Details
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold text-2xl shadow-sm border border-brand/20">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-800 text-lg">{user.name}</h4>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border", getRoleBadgeColor(user.role))}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail size={14} className="text-slate-400" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-sm">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Billing Tier</span>
                <span className="font-bold text-slate-700 capitalize">{user.subscriptionPlan} Plan</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Member Since</span>
                <span className="font-bold text-slate-700">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Team Management Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Users className="text-slate-400" size={20} />
                Workspace Team Members
              </h3>
              {teamLoading && <RefreshCw size={16} className="text-slate-400 animate-spin" />}
            </div>

            {/* Invite Panel (Root Admins Only — users who own the workspace) */}
            {isRootAdmin && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <UserPlus size={16} className="text-indigo-500" />
                  Invite Workspace Member
                </h4>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand shadow-sm"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand shadow-sm font-semibold text-slate-700"
                  >
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={inviteLoading || teamLoading}
                    className="bg-brand hover:bg-brand-dark text-white font-bold h-10 px-6 rounded-xl shrink-0"
                  >
                    {inviteLoading ? <RefreshCw className="animate-spin mr-1" size={14} /> : null}
                    Send Invite
                  </Button>
                </form>
                <p className="text-[11px] text-slate-400">Invited members share access to all your chatbots and leads CRM records.</p>
              </div>
            )}

            {/* Members & Invites List */}
            {teamLoading && !teamData ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-300" />
                <span className="text-sm font-medium">Loading team workspace data...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Members */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workspace Members</h4>
                  <div className="border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                    {/* Root Owner / Admin Row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-sm border border-amber-200">
                          {isChildMember && user.ownerInfo
                            ? user.ownerInfo.name.charAt(0).toUpperCase()
                            : user.name ? user.name.charAt(0).toUpperCase() : "O"}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-800 block">
                            {isChildMember && user.ownerInfo
                              ? `${user.ownerInfo.name}`
                              : `${user.name}`}
                            <span className="text-slate-400 font-normal text-xs ml-1.5">(Owner)</span>
                          </span>
                          <span className="text-xs text-slate-400 block">
                            {isChildMember && user.ownerInfo ? user.ownerInfo.email : user.email}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-rose-50 text-rose-700 border-rose-200">
                        Admin
                      </span>
                    </div>

                    {/* Current user row (if child member — show themselves in the list) */}
                    {isChildMember && (
                      <div className="p-4 flex items-center justify-between gap-4 bg-indigo-50/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm border border-indigo-100">
                            {user.name ? user.name.charAt(0).toUpperCase() : "M"}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-800 block">
                              {user.name}
                              <span className="text-indigo-500 font-normal text-xs ml-1.5">(You)</span>
                            </span>
                            <span className="text-xs text-slate-500 block">{user.email}</span>
                          </div>
                        </div>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border", getRoleBadgeColor(user.role))}>
                          {user.role}
                        </span>
                      </div>
                    )}

                    {/* Other Invited Active Members */}
                    {teamData?.members && teamData.members.length > 0 ? (
                      teamData.members
                        .filter(m => m.email !== user.email) // Don't duplicate current user
                        .map((member) => (
                        <div key={member._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm border border-indigo-100">
                              {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-slate-800 block">{member.name}</span>
                              <span className="text-xs text-slate-500 block">{member.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border", getRoleBadgeColor(member.role))}>
                              {member.role}
                            </span>
                            {isRootAdmin && (
                              <button
                                onClick={() => handleRemoveMember(member._id, member.name)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                                title="Remove Member"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>

                {/* Pending Invites (Visible to Root Admin Only) */}
                {isRootAdmin && teamData?.invites && teamData.invites.filter(i => i.status === "pending").length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Invitations</h4>
                    <div className="border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                      {teamData.invites
                        .filter(i => i.status === "pending")
                        .map((invite) => (
                          <div key={invite._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                                <Clock size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-sm text-slate-700 block">{invite.email}</span>
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mt-0.5">
                                  <Clock size={10} /> Pending Registration
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border", getRoleBadgeColor(invite.role))}>
                                {invite.role}
                              </span>
                              <button
                                onClick={() => handleRevokeInvite(invite._id, invite.email)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                                title="Revoke Invitation"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Subscriptions & Billing */}
        <div className="space-y-8">
          <SubscriptionCard user={user as any} role={user.role} />
        </div>
      </div>
    </div>
  );
}
