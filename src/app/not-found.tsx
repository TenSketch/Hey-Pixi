import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-slate-100/50">
        <Search size={40} />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
        Page <span className="text-brand underline">Not Found</span>
      </h1>
      
      <p className="text-slate-600 text-lg max-w-md mb-10 font-medium">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link href="/">
        <Button 
          size="lg"
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-none h-12 px-8 flex gap-2 items-center shadow-lg"
        >
          <Home size={18} />
          Back Home
        </Button>
      </Link>
    </div>
  );
}
