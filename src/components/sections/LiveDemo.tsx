
"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { Send, Bot, ShoppingBag, Stethoscope, Briefcase, RefreshCcw, Check } from "lucide-react"
import ReactMarkdown from 'react-markdown'

// Types of Pixi Personalities
const PIXI_MODES = [
  { 
    id: 'general', 
    name: 'General Pixi', 
    icon: Bot, 
    color: 'bg-blue-500', 
    description: 'Trained on company data.',
    initialMessage: "Hi! I'm Pixi. Ask me anything about TenSketch or our services! 👋" 
  },
  { 
    id: 'healthcare', 
    name: 'Healthcare Pixi', 
    icon: Stethoscope, 
    color: 'bg-emerald-500',
    description: 'Patient scheduling.',
    initialMessage: "Hello! Welcome to City Hospital. How can I help you book an appointment today?" 
  },
  { 
    id: 'ecommerce', 
    name: 'E-commerce Pixi', 
    icon: ShoppingBag, 
    color: 'bg-violet-500',
    description: 'Product support.',
    initialMessage: "Hey! Looking for some trendy sneakers or a gift? I can help you find the perfect match! 👟" 
  },
  { 
    id: 'saas', 
    name: 'SaaS Support', 
    icon: Briefcase, 
    color: 'bg-amber-500',
    description: 'Tech onboarding.',
    initialMessage: "Welcome to SaaSY! Need help configuring your API keys or setting up the dashboard?" 
  },
]

type Message = { id: number; text: string; sender: 'user' | 'bot'; }

export function LiveDemo() {
  const [activeMode, setActiveMode] = useState(PIXI_MODES[0])
  const [messages, setMessages] = useState<Message[]>([{ id: 1, text: PIXI_MODES[0].initialMessage, sender: 'bot' }])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => { 
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: "smooth"
          })
      }
  }
  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const handleModeSwitch = (mode: typeof PIXI_MODES[0]) => {
      setActiveMode(mode)
      setMessages([{ id: Date.now(), text: mode.initialMessage, sender: 'bot' }])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim()) return
      
      const userMsg: Message = { id: Date.now(), text: inputValue, sender: 'user' }
      setMessages(prev => [...prev, userMsg])
      setInputValue("")
      setIsTyping(true)

      try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: inputValue, 
                persona: activeMode.id 
            })
        })
        
        const data = await response.json()
        
        if (!response.ok) throw new Error(data.error)
        
        const botMsg: Message = { id: Date.now() + 1, text: data.result, sender: 'bot' }
        setMessages(prev => [...prev, botMsg])
      } catch (error) {
          console.error(error)
          const errorMsg: Message = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting to the brain right now. 🤯", sender: 'bot' }
          setMessages(prev => [...prev, errorMsg])
      } finally {
          setIsTyping(false)
      }
  }

  return (
    <section id="demo" className="py-24 bg-white relative overflow-hidden">
        {/* Soft decorative background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
             >
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                    See Pixi in <span className="text-brand">Action</span>
                </h2>
            </motion.div>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Real-time AI that adapts to your industry. Try switching personalities below.
            </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
            {/* Personality Selector - Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="bg-white p-2 border border-slate-200 sticky top-24">
                    {PIXI_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => handleModeSwitch(mode)}
                            className={cn(
                                "flex items-center gap-3 p-3 transition-all duration-200 w-full text-left relative overflow-hidden border-b border-transparent hover:border-slate-100",
                                activeMode.id === mode.id 
                                    ? "bg-slate-50 text-slate-900 font-bold border-l-2 border-l-brand" 
                                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <div className={cn("p-2 text-white shadow-sm transition-transform", mode.color)}>
                                <mode.icon size={16} />
                            </div>
                            <span className="text-sm font-mono">{mode.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Interface - Sharp Card */}
            <div className="lg:col-span-9">
                <div className="h-[600px] bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden relative">
                     {/* Chat Header */}
                     <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                         <div className="flex items-center gap-3">
                             <div className={cn("w-10 h-10 flex items-center justify-center text-white shadow-sm transition-colors", activeMode.color)}>
                                 <Bot size={20} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-slate-900 text-sm font-mono uppercase">{activeMode.name}</h3>
                                 <div className="flex items-center gap-1.5">
                                     <span className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                                     <span className="text-xs text-slate-500 font-medium">ONLINE</span>
                                 </div>
                             </div>
                         </div>
                         <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 rounded-none" onClick={() => handleModeSwitch(activeMode)}>
                             <RefreshCcw size={16} />
                         </Button>
                     </div>

                    {/* Chat Messages */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                        <AnimatePresence initial={false} mode="popLayout">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    layout
                                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn("flex gap-3 max-w-[80%]", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className={cn("w-8 h-8 flex-shrink-0 flex items-center justify-center text-white text-xs mt-1 shadow-sm", activeMode.color)}>
                                            <Bot size={14} />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "p-4 text-sm leading-relaxed shadow-sm border",
                                        msg.sender === 'user' 
                                            ? "bg-brand text-white border-brand" 
                                            : "bg-white border-slate-200 text-slate-700"
                                    )}>
                                        <div className={cn(
                                            "prose prose-sm max-w-none",
                                            msg.sender === 'user' ? "prose-invert" : "prose-slate"
                                        )}>
                                            <ReactMarkdown>
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isTyping && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                               <div className={cn("w-8 h-8 flex-shrink-0 flex items-center justify-center text-white text-xs shadow-sm", activeMode.color)}>
                                    <Bot size={14} />
                                </div>
                                <div className="bg-white border border-slate-200 p-4 flex gap-1 h-10 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-slate-400 animate-bounce" />
                                </div>
                            </motion.div>
                        )}
                        {/* Removed ref div */}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type command..."
                                className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 pr-14 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all font-mono text-sm text-slate-800 placeholder:text-slate-400"
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={!inputValue.trim()}
                                className={cn("absolute right-2 top-2 h-9 w-9 transition-transform hover:scale-105 shadow-sm rounded-none", activeMode.color)}
                            >
                                <Send size={16} />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  )
}
