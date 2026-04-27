import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { BotConfig, User } from "@/models";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Bot, Plus, Settings } from "lucide-react";

export default async function BotsPage() {
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

  const bots = await BotConfig.find({ userId: dbUser._id }).sort({ createdAt: -1 });

  return (
    <div className="max-w-5xl">
       <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Your AI Agents</h2>
                <p className="text-slate-500 mt-1">Manage your deployed chatbots and deploy new ones.</p>
            </div>
            <Link href="/dashboard/bots/new">
                <Button className="bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                </Button>
            </Link>
       </div>

       {bots.length === 0 ? (
           <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No agents found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">You haven&apos;t created any AI agents yet. Start by creating a custom agent trained on your website data.</p>
                <Link href="/dashboard/bots/new">
                    <Button className="bg-brand hover:bg-brand-dark">Create Your First Agent</Button>
                </Link>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {bots.map((bot) => (
                   <div key={bot._id.toString()} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: bot.themeColor }}>
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{bot.name}</h3>
                                    <p className="text-xs text-slate-500 capitalize">{bot.role} Agent</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-semibold ${bot.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {bot.isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        <div className="text-sm text-slate-600 mb-6 line-clamp-2">
                            Trained on: <span className="font-medium text-slate-900">{bot.url}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                             <Link href={`/dashboard/bots/${bot._id}`} className="flex-1">
                                <Button variant="outline" className="w-full text-slate-600 hover:text-brand">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Configure
                                </Button>
                            </Link>
                            {bot.isActive && (
                                <Link href={`/dashboard/leads?botId=${bot._id}`} className="flex-1">
                                    <Button variant="ghost" className="w-full text-brand hover:bg-brand-light">
                                        View Leads
                                    </Button>
                                </Link>
                             )}
                        </div>
                   </div>
               ))}
           </div>
       )}
    </div>
  );
}
