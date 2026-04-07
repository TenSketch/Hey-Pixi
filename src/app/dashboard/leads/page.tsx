import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { BotConfig, Lead, User } from "@/models";
import { MessageSquare } from "lucide-react";
import { LeadsClient } from "@/components/dashboard/LeadsClient";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ botId?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  await dbConnect();
  const dbUser = await User.findOne({ email: session.user.email });
  
  if (!dbUser) {
      return <div>Please create an account first.</div>;
  }

  // Find bots for this user to filter leads if needed
  const userBots = await BotConfig.find({ userId: dbUser._id });
  const botIds = userBots.map(b => b._id);

  const filterParam = await searchParams;
  const query: Record<string, unknown> = { botId: { $in: botIds } };
  
  if (filterParam.botId) {
      query.botId = filterParam.botId;
  }

  const leads = await Lead.find(query).sort({ createdAt: -1 }).populate('botId', 'name').lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedLeads = (leads as any[]).map(lead => ({
    _id: lead._id.toString(),
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    lastMessage: lead.lastMessage,
    transcript: lead.transcript as Array<{ text: string; sender: 'user' | 'bot' }>,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    botId: lead.botId ? {
        _id: lead.botId._id.toString(),
        name: lead.botId.name
    } : undefined,
  }));

  return (
    <div className="max-w-6xl">
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Leads CRM</h2>
                <p className="text-slate-500 mt-1">Review contact information captured by your AI agents.</p>
            </div>
            <div className="text-sm font-semibold text-brand">
                Total Leads: {serializedLeads.length}
            </div>
        </div>

        {serializedLeads.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No leads captured yet</h3>
                <p className="text-slate-500">When your AI agents capture phone numbers or emails, they will appear here.</p>
            </div>
        ) : (
            <LeadsClient initialLeads={serializedLeads} />
        )}
    </div>
  );
}
