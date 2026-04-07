import { Bot, Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full min-h-[400px]">
      <div className="w-16 h-16 bg-brand-light flex items-center justify-center text-brand rounded-full mb-6">
        <Bot size={32} className="animate-bounce" />
      </div>
      <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
        <Loader2 className="w-5 h-5 animate-spin text-brand" />
        Processing your AI Agents...
      </div>
      <p className="text-slate-500 mt-2 text-sm italic font-mono">FETCH_QUERY_STATUS: IN_PROGRESS</p>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
         {[1, 2, 3].map((i) => (
           <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-[180px] animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                 <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-50 rounded w-1/4" />
                 </div>
              </div>
              <div className="h-4 bg-slate-50 rounded w-full mb-8" />
              <div className="h-10 bg-slate-100 rounded w-full" />
           </div>
         ))}
      </div>
    </div>
  );
}
