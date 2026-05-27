
"use client"

import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Sparkles, Send, Wand2 } from "lucide-react"

export function Hero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 bg-white">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      {/* Glow decoration */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left: Pixi Brand Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
            <Sparkles size={12} /> Play with AI before you buy it
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[1.05]">
            Hey 👋 I&apos;m <br />
            <span className="text-gradient">Pixi</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-lg font-medium">
            Talk to me. See what I can do for your business.
          </p>

          <p className="text-base text-slate-500 max-w-md">
            Try different chatbot types, or build one with your own business data — no signup needed.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Button 
              size="lg" 
              onClick={() => scrollTo("demo")}
              className="h-14 px-8 text-base bg-brand hover:bg-brand-dark text-white rounded-full transition-all hover:scale-105 group shadow-lg shadow-brand/25 font-bold"
            >
              <Bot className="w-5 h-5 mr-2" />
              Talk to Pixi
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => scrollTo("onboard")}
              className="h-14 px-8 text-base border-2 border-slate-200 text-slate-900 hover:bg-slate-50 rounded-full font-bold hover:border-brand"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Build My Own
            </Button>
          </div>
        </motion.div>

        {/* Right: Pixi Chat Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 5 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center lg:justify-end perspective-1000"
        >
          <div className="relative w-full max-w-[480px] bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 bg-gradient-to-r from-brand/5 to-sky-500/5 border-b border-slate-100 flex items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand to-sky-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand/30">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Pixi</h3>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online now
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-float" />
                demo
              </div>
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
                  <p>Hey there! 👋 I&apos;m Pixi. Want me to help you find the perfect chatbot for your business? Tell me what you do! 😊</p>
                </div>
              </motion.div>

              {/* User Message */}
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
                className="flex gap-3 flex-row-reverse"
              >
                <div className="bg-gradient-to-r from-brand to-sky-500 text-white rounded-2xl rounded-tr-sm p-4 text-sm leading-relaxed max-w-[85%] shadow-md">
                  <p>I run an e-commerce store selling organic skincare products 🧴</p>
                </div>
              </motion.div>

              {/* Typing Indicator */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ times: [0, 0.1, 0.9, 1], duration: 1.3, delay: 2.8 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-brand to-sky-500 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm">
                  <Bot size={14} />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-slate-100 flex items-center gap-1.5">
                  <motion.span className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1 }} />
                  <motion.span className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.15 }} />
                  <motion.span className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.3 }} />
                </div>
              </motion.div>

              {/* Bot Message 2 */}
              <motion.div 
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 4.2, type: "spring", stiffness: 200 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-brand to-sky-500 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm">
                  <Bot size={14} />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 text-slate-700 text-sm leading-relaxed max-w-[85%] shadow-sm border border-slate-100 space-y-2">
                  <p>Organic skincare — love it! 🌿 I think you&apos;d be perfect for:</p>
                  <div className="p-3 bg-gradient-to-r from-brand/5 to-sky-500/5 rounded-xl border border-brand/10">
                    <span className="font-bold text-sm text-brand">🛍️ E-commerce Pixi</span>
                    <p className="text-xs text-slate-500 mt-1">Product recommendations, order tracking, and cart recovery.</p>
                  </div>
                  <p>Want to try it? 👇</p>
                </div>
              </motion.div>
            </div>

            {/* Input Placeholder */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div onClick={() => scrollTo("demo")} className="w-full h-12 bg-slate-100 rounded-xl flex items-center px-4 justify-between text-slate-400 text-sm font-medium transition-colors hover:bg-slate-200/70 cursor-pointer">
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
