
"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { Send, Bot, Target, Headphones, RefreshCcw, Globe, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'

// Types of Pixi Personalities
const PIXI_MODES = [
  { 
    id: 'leadgen', 
    name: 'Pixi Lead Gen', 
    icon: Target, 
    color: 'bg-emerald-500', 
    description: 'Capture & qualify leads.',
    initialMessage: "Hi! I'm your Lead Gen Pixi 🎯 I'll help you capture and qualify visitors. Want to see how I collect name, phone, and requirements?" 
  },
  { 
    id: 'support', 
    name: 'Pixi Support', 
    icon: Headphones, 
    color: 'bg-blue-500',
    description: 'Answer FAQs 24/7.',
    initialMessage: "Hey! I'm your Support Pixi 🎧 Ask me any question about your product or service — I'm trained on your docs!" 
  },
  { 
    id: 'coming-soon', 
    name: 'More Coming Soon', 
    icon: Bot, 
    color: 'bg-slate-300',
    description: 'E-commerce, Healthcare, SaaS...',
    initialMessage: "",
    disabled: true
  },
]

type Message = { id: number; text: string; sender: 'user' | 'bot'; }

const MODE_BY_ID: Record<string, typeof PIXI_MODES[0]> = Object.fromEntries(
  PIXI_MODES.filter(m => !m.disabled).map(m => [m.id, m])
)

export function LiveDemo() {
  const [activeMode, setActiveMode] = useState(PIXI_MODES[0])
  const [messages, setMessages] = useState<Message[]>([{ id: 1, text: PIXI_MODES[0].initialMessage, sender: 'bot' }])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState("")
  const [isTraining, setIsTraining] = useState(false)
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleModeSwitch = (mode: typeof PIXI_MODES[0]) => {
      setActiveMode(mode)
      setMessages([{ id: Date.now(), text: mode.initialMessage, sender: 'bot' }])
      setCustomSystemPrompt(null)
      setShowUrlInput(false)
  }

  const handleTrainOnUrl = async () => {
    if (!customUrl.trim()) return
    setIsTraining(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customUrl.trim(), sourceType: 'url' })
      })
      const data = await res.json()
      if (data.prompt) {
        setCustomSystemPrompt(data.prompt)
        setMessages([
          { id: Date.now(), text: `I've learned about your website! 🎉 Ask me anything about ${customUrl.trim()} or switch personalities above.`, sender: 'bot' }
        ])
      } else {
        setCustomSystemPrompt(`You are a helpful assistant trained on content from ${customUrl.trim()}. Answer questions based on that knowledge.`)
        setMessages([
          { id: Date.now(), text: `I've noted your website! 🎉 I'll do my best to answer based on ${customUrl.trim()}. Try asking me something!`, sender: 'bot' }
        ])
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), text: "Couldn't analyze that URL. Try a different one or just chat with me! 😊", sender: 'bot' }])
    } finally {
      setIsTraining(false)
    }
  }

  // Listen for custom event from ChatbotTypes cards
  useEffect(() => {
    const handler = (e: Event) => {
      const { mode } = (e as CustomEvent).detail
      const found = MODE_BY_ID[mode]
      if (found) handleModeSwitch(found)
    }
    window.addEventListener("pixi-switch-mode", handler)
    return () => window.removeEventListener("pixi-switch-mode", handler)
  }, [])

  const scrollToBottom = () => { 
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: "smooth"
          })
      }
  }
  useEffect(() => { scrollToBottom() }, [messages, isTyping])

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
                persona: activeMode.id,
                ...(customSystemPrompt ? { systemPrompt: customSystemPrompt } : {})
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
    <section id="demo" className="py-24 md:py-32 bg-white relative overflow-hidden scroll-mt-24">
        {/* Soft decorative background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
             >
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                    Talk to <span className="text-gradient">Pixi</span> Right Now
                </h2>
            </motion.div>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Switch between Lead Gen and Support mode — or try with your own website URL.
            </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
            {/* Personality Selector - Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="bg-white p-2 border border-slate-200 sticky top-24">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono px-3 pb-2 pt-1">Personalities</div>
                    {PIXI_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => !mode.disabled && handleModeSwitch(mode)}
                            disabled={mode.disabled}
                            className={cn(
                                "flex items-center gap-3 p-3 transition-all duration-200 w-full text-left relative overflow-hidden border-b border-transparent",
                                mode.disabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:border-slate-100",
                                !mode.disabled && activeMode.id === mode.id
                                    ? "bg-slate-50 text-slate-900 font-bold border-l-2 border-l-brand" 
                                    : !mode.disabled && "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <div className={cn("p-2 text-white shadow-sm transition-transform", mode.color)}>
                                <mode.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono block truncate">{mode.name}</span>
                                  {mode.disabled && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Soon</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium block truncate">{mode.description}</span>
                            </div>
                        </button>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-2" />

                    {/* Try with your own data */}
                    <div className="px-3 pt-1 pb-2">
                        <button
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="flex items-center gap-2 w-full text-left text-xs font-bold text-slate-500 hover:text-brand transition-colors"
                        >
                            <Globe size={14} />
                            <span>Try with your own data</span>
                            {showUrlInput ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                        </button>

                        <AnimatePresence>
                          {showUrlInput && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 space-y-2">
                                <input
                                  type="text"
                                  value={customUrl}
                                  onChange={(e) => setCustomUrl(e.target.value)}
                                  placeholder="https://your-store.com"
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/15 text-slate-800 rounded-none"
                                />
                                <Button
                                  size="sm"
                                  onClick={handleTrainOnUrl}
                                  disabled={!customUrl.trim() || isTraining}
                                  className="w-full bg-brand hover:bg-brand-dark text-white text-xs font-bold h-8 rounded-none"
                                >
                                  {isTraining ? (
                                    <><Loader2 size={12} className="animate-spin mr-1" /> Learning...</>
                                  ) : (
                                    <><Globe size={12} className="mr-1" /> Train on my site</>
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {customSystemPrompt && (
                          <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Using your website data
                          </div>
                        )}
                    </div>
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
