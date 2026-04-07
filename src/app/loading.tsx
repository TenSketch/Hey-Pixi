import { Bot } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20 animate-pulse">
          <Bot className="w-8 h-8 text-brand" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full animate-bounce" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-slate-900 tracking-tight animate-pulse">
        Initializing Pixi...
      </h2>
      <p className="mt-2 text-slate-500 text-sm font-medium animate-pulse">
        Connecting to the intelligent brain
      </p>
    </div>
  );
}
