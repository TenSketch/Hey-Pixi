
"use client"

import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"
import { ArrowRight, Bot, MoreHorizontal, Send, Sparkles } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 bg-white">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left: Minimal Content */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
        >
          <div className="w-12 h-1 bg-brand mb-2 rounded-full" />
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.1]">
            INTELLIGENT <br />
            <span className="text-brand">SALES AGENT</span>
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
            Deploy autonomous AI agents that qualify leads, book meetings, and solve tickets 24/7.
          </p>

          <div className="flex flex-row gap-3 w-fit mt-4">
             <Link href="#demo">
                <Button size="lg" className="h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all hover:scale-105 group shadow-lg shadow-slate-900/20">
                    Start Demo
                    <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                </Button>
            </Link>
            <Link href="/signup">
                 <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-slate-200 text-slate-900 hover:bg-slate-50 rounded-xl font-bold hover:border-slate-300">
                    View Pricing
                </Button>
            </Link>
          </div>
        </motion.div>

        {/* Right: Polished Chat Window Visual */}
        <motion.div
             initial={{ opacity: 0, y: 30, rotateX: 5 }}
             animate={{ opacity: 1, y: 0, rotateX: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="flex justify-center lg:justify-end perspective-1000"
        >
             <div className="relative w-full max-w-[480px] bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                 {/* Chat Header */}
                 <div className="h-16 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between px-5">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-brand to-sky-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand/30">
                             <Sparkles size={18} />
                         </div>
                         <div>
                             <h3 className="font-bold text-slate-900 text-sm">Sales Pixi</h3>
                             <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                 Online now
                             </p>
                         </div>
                     </div>
                     <MoreHorizontal className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
                 </div>
                 
                 {/* Chat Area */}
                 <div className="p-5 bg-slate-50/50 min-h-[380px] flex flex-col gap-5 relative">
                     {/* Bot Message 1 */}
                     <motion.div 
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                        className="flex gap-3"
                     >
                         <div className="w-8 h-8 bg-gradient-to-br from-brand to-sky-500 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm">
                             <Bot size={14} />
                         </div>
                         <div className="bg-white rounded-2xl rounded-tl-sm p-4 text-slate-700 text-sm leading-relaxed max-w-[85%] shadow-sm border border-slate-100">
                             <p>Hey there! 👋 I see you&apos;re checking out the Enterprise plan. Want me to break down the volume discounts?</p>
                         </div>
                     </motion.div>

                     {/* User Message */}
                     <motion.div 
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
                        className="flex gap-3 flex-row-reverse"
                     >
                         <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl rounded-tr-sm p-4 text-sm leading-relaxed max-w-[85%] shadow-md">
                             <p>Yes, specifically for 50+ seats.</p>
                         </div>
                     </motion.div>

                     {/* Typing Indicator */}
                     <motion.div 
                        initial={{ opacity: 0, y: 10, display: "flex" }}
                        animate={{ opacity: [0, 1, 1, 0], y: 0, display: ["flex", "flex", "flex", "none"] }}
                        transition={{ 
                            times: [0, 0.1, 0.9, 1],
                            duration: 1.3, 
                            delay: 2.2 
                        }}
                        className="flex gap-3"
                     >
                         <div className="w-8 h-8 bg-gradient-to-br from-brand to-sky-500 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm">
                             <Bot size={14} />
                         </div>
                         <motion.div 
                            className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-slate-100 flex items-center gap-1.5"
                         >
                             <motion.span 
                                className="w-2 h-2 bg-slate-400 rounded-full"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1 }}
                             />
                             <motion.span 
                                className="w-2 h-2 bg-slate-400 rounded-full"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.15 }}
                             />
                             <motion.span 
                                className="w-2 h-2 bg-slate-400 rounded-full"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.3 }}
                             />
                         </motion.div>
                     </motion.div>

                      {/* Bot Message 2 (appears after typing) */}
                     <motion.div 
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 3.5, type: "spring", stiffness: 200 }}
                        className="flex gap-3"
                     >
                         <div className="w-8 h-8 bg-gradient-to-br from-brand to-sky-500 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm">
                             <Bot size={14} />
                         </div>
                         <div className="bg-white rounded-2xl rounded-tl-sm p-4 text-slate-700 text-sm leading-relaxed max-w-[85%] shadow-sm border border-slate-100 space-y-3">
                             <p>Got it! Here&apos;s what I found:</p> 
                             <div className="p-3 bg-gradient-to-r from-brand/5 to-sky-500/5 rounded-xl border border-brand/10">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Enterprise 50+</span>
                                     <span className="font-bold text-brand text-lg">$29<span className="text-xs text-slate-400">/seat</span></span>
                                 </div>
                                 <p className="text-xs text-slate-500">Includes SSO & dedicated support.</p>
                             </div>
                             <p>Should I schedule a quick demo call? 📅</p>
                         </div>
                     </motion.div>
                 </div>

                 {/* Input Placeholder */}
                 <div className="p-4 bg-white border-t border-slate-100">
                     <div className="w-full h-12 bg-slate-100 rounded-xl flex items-center px-4 justify-between text-slate-400 text-sm font-medium transition-colors hover:bg-slate-200/70 cursor-text">
                         <span>Type your response...</span>
                         <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/30">
                            <Send size={16} />
                         </div>
                     </div>
                 </div>
             </div>
        </motion.div>
      </div>
    </section>
  )
}
