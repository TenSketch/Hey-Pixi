import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User, Lead } from "@/models";
import { Bot, MessageSquare, TrendingUp, Users } from "lucide-react";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  await dbConnect();

  let dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) {
    dbUser = await User.create({
      email: session.user.email as string,
      name: session.user.name || "User",
    });
  }

  const bots = await BotConfig.find({ userId: dbUser._id });
  const activeBots = bots.filter(b => b.isActive).length;
  const botIds = bots.map(b => b._id);

  // 1. Total Stats
  const totalLeads = await Lead.countDocuments({ botId: { $in: botIds } });
  
  // 2. Real Lead Data for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyLeads = await Lead.aggregate([
    { $match: { botId: { $in: botIds }, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing days with 0
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const match = dailyLeads.find(item => item._id === dateStr);
    chartData.push({
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      leads: match ? match.count : 0
    });
  }

  // 3. Bot Performance Data
  const botPerformance = await Lead.aggregate([
    { $match: { botId: { $in: botIds } } },
    {
      $group: {
        _id: "$botId",
        leads: { $sum: 1 }
      }
    }
  ]);

  const botPerformanceData = bots.map(bot => {
    const perf = botPerformance.find(p => p._id.toString() === bot._id.toString());
    return {
      name: bot.name,
      leads: perf ? perf.leads : 0
    };
  });

  // Since we currently track conversations primarily when a lead is captured, 
  // we'll set this to the total number of leads for now to be accurate to your data.
  // In the future, this could track all anonymous sessions.
  const totalConversations = totalLeads;
  const conversionRate = totalConversations > 0 ? 100 : 0; // If every tracked conversation is a lead, it's 100%

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
       <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h2>
            <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your AI agents today.</p>
       </div>

       {/* Top Stats Cards */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                    <Bot className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bots.length}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        <span className="text-brand font-medium">{activeBots}</span> active
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalLeads}</div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        Captured from your bots
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalConversations}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        Total tracked interactions
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-brand text-white border-brand-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-brand-light">Lead Conversion</CardTitle>
                    <TrendingUp className="h-4 w-4 text-brand-light" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{conversionRate}%</div>
                    <p className="text-xs text-brand-light mt-1">
                        Capture rate per conversation
                    </p>
                </CardContent>
            </Card>
       </div>

       {/* Charts */}
       <OverviewCharts 
         leadData={chartData} 
         botPerformanceData={botPerformanceData} 
       />
    </div>
  );
}

