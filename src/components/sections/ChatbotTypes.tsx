
"use client"

import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"
import { ArrowUpRight, Headphones, Target, Settings, Zap, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPES = [
  {
    id: "sales",
    title: "Pixi Sales",
    description: "Your 24/7 top-performing sales rep.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    colSpan: "lg:col-span-2",
    features: ["Product Recommendations", "Checkout Assistance"]
  },
  {
    id: "support",
    title: "Support Hub",
    description: "Instant answers for diverse customer queries.",
    icon: Headphones,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    colSpan: "lg:col-span-1",
    features: ["Ticket Deflection", "Multi-language"]
  },
  {
    id: "leadgen",
    title: "Lead Hunter",
    description: "Qualifies visitors before booking meetings.",
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    colSpan: "lg:col-span-1",
     features: ["Calendar Sync", "CRM Integration"]
  },
  {
    id: "internal",
    title: "Ops Copilot",
    description: "The brain for your internal documents.",
    icon: Settings,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    colSpan: "lg:col-span-2",
     features: ["Slack Integration", "Secure Access"]
  },
]

export function ChatbotTypes() {
  return (
    <section id="features" className="py-32 bg-slate-50 relative">
      <div className="container mx-auto px-4">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Globe size={12} />
              <span>Use Cases</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            Built for <span className="text-brand">Every Goal</span>
          </h2>
          <p className="text-slate-600 text-lg">
            Whether you need to sell more, support better, or work smarter, there&apos;s a specialized Pixi agent for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TYPES.map((type, idx) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={cn(
                  "group relative bg-white p-8 border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-brand/30",
                  type.colSpan
              )}
            >
                <div className="relative z-10 flex flex-col h-full">
                    <div className={cn(
                        "w-14 h-14 flex items-center justify-center mb-6 transition-colors",
                        type.bg, type.color
                    )}>
                        <type.icon size={28} />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2 text-slate-900 font-mono tracking-tight">{type.title}</h3>
                    <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                        {type.description}
                    </p>
                    
                    <div className="mt-auto">
                        <div className="flex flex-wrap gap-2 mb-6">
                            {type.features.map(f => (
                                <span key={f} className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                                    {f}
                                </span>
                            ))}
                        </div>
                        
                        <Button variant="ghost" className="w-full justify-between hover:bg-slate-50 text-slate-900 font-semibold group/btn border border-slate-200 hover:border-brand rounded-none">
                            Explore {type.title}
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 text-slate-400 group-hover/btn:text-brand" />
                        </Button>
                    </div>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
