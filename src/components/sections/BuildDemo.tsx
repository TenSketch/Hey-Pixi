
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Globe, FileText, CheckCircle2, ArrowRight, Sparkles, Wand2, ChevronRight, User, ShoppingCart, Headset, BarChart3, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'

const STEPS = [
    { title: "Role", icon: Bot },
    { title: "Data", icon: Globe },
    { title: "Identity", icon: User },
]

const ROLES = [
    { id: 'sales', title: 'Sales Agent', icon: ShoppingCart, desc: 'Recommend products & close deals.' },
    { id: 'support', title: 'Customer Support', icon: Headset, desc: 'Solve tickets 24/7 instantly.' },
    { id: 'lead', title: 'Lead Qualifier', icon: BarChart3, desc: 'Score and book meetings.' },
    { id: 'custom', title: 'Custom Bot', icon: Wand2, desc: 'Build for any specific niche.' },
]

// -- Internal Test Chat Component --
function TestChatWindow({ botName, role, url, onClose }: { botName: string, role: string, url: string, onClose: () => void }) {
    const [messages, setMessages] = useState([{ id: 1, text: `Hello! I am ${botName || 'Pixi'}. How can I assist you today?`, sender: 'bot' }])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const selectedRoleObj = ROLES.find(r => r.id === role)
    
    // Construct Dynamic System Prompt
    const systemPrompt = `You are ${botName}, a ${selectedRoleObj?.title || 'Custom AI'} agent. 
    Your primary objective is: ${selectedRoleObj?.desc}.
    Your knowledge base is derived from the website: ${url || 'general knowledge'}.
    Keep responses concise, professional, and helpful. Use 1-2 emojis if appropriate.`

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if(!input.trim()) return

        const userMsg = { id: Date.now(), text: input, sender: 'user' }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: userMsg.text,
                    persona: 'custom',
                    systemPrompt: systemPrompt 
                })
            })
            const data = await res.json()
            setMessages(prev => [...prev, { id: Date.now() + 1, text: data.result, sender: 'bot' }])
        } catch {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Connection error.", sender: 'bot' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-white z-20 flex flex-col"
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand flex items-center justify-center text-white rounded-none shadow-sm">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{botName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-brand font-medium">
                            <span className="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"/>
                            Live Preview
                        </div>
                    </div>
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="rounded-none hover:bg-slate-200">
                    <X size={20} className="text-slate-500" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex w-full", m.sender === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[80%] p-3 text-sm border shadow-sm",
                            m.sender === 'user' 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-800 border-slate-200"
                        )}>
                            <div className={cn(
                                "prose prose-sm max-w-none",
                                m.sender === 'user' ? "prose-invert" : "prose-slate"
                            )}>
                                <ReactMarkdown>
                                    {m.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="bg-white p-3 border border-slate-200 shadow-sm flex gap-1">
                             <span className="w-1.5 h-1.5 bg-slate-400 animate-bounce"/>
                             <span className="w-1.5 h-1.5 bg-slate-400 animate-bounce delay-75"/>
                             <span className="w-1.5 h-1.5 bg-slate-400 animate-bounce delay-150"/>
                         </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Test your new agent..."
                    className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-brand transition-colors rounded-none font-mono"
                    autoFocus
                />
                <Button type="submit" size="icon" className="rounded-none bg-brand hover:bg-brand-dark" disabled={isLoading}>
                    <Send size={18} />
                </Button>
            </form>
        </motion.div>
    )
}

export function BuildDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState("")
  const [url, setUrl] = useState("")
  const [botName, setBotName] = useState("")
  const [isTraining, setIsTraining] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [showTestChat, setShowTestChat] = useState(false)
  
  const handleNext = () => {
      if(currentStep === 2) {
          setIsTraining(true)
          setTimeout(() => {
              setIsTraining(false)
              setIsFinished(true)
          }, 2000)
      } else {
          setCurrentStep(prev => prev + 1)
      }
  }

  const handleBack = () => {
      if(currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  // Reset wizard
  const handleReset = () => {
      setIsFinished(false)
      setCurrentStep(0)
      setSelectedRole("")
      setUrl("")
      setBotName("")
      setShowTestChat(false)
  }

  return (
    <section id="demo-build" className="py-32 bg-slate-50 relative overflow-hidden">
        {/* Simple Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
        
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Build Your Custom <span className="text-brand">AI Agent</span></h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
                No coding required. Have a working demo in 3 simple steps.
            </p>
        </div>

        <div className="max-w-4xl mx-auto w-full">
            {/* Progress Stepper */}
            <div className="flex justify-center mb-8">
                <div className="flex items-center gap-2 sm:gap-4 bg-white p-3 px-3 sm:px-6 shadow-sm border border-slate-200 overflow-x-auto max-w-full">
                    {STEPS.map((step, idx) => (
                        <div key={idx} className="flex items-center">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 transition-colors text-sm font-medium border border-transparent",
                                currentStep === idx ? "bg-brand text-white border-brand" : 
                                idx < currentStep ? "text-brand bg-brand-light border-brand/20" : "text-slate-400"
                            )}>
                                {idx < currentStep ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
                                <span className="font-mono hidden sm:inline">{step.title}</span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className="w-8 h-px bg-slate-200 mx-1 sm:mx-2" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Wizard Card */}
            <div className="bg-white shadow-xl border border-slate-200 overflow-hidden min-h-[500px] flex flex-col relative w-full">
                
                {/* Embed Test Chat Overlay */}
                <AnimatePresence>
                    {showTestChat && (
                        <TestChatWindow 
                            botName={botName} 
                            role={selectedRole} 
                            url={url} 
                            onClose={handleReset} 
                        />
                    )}
                </AnimatePresence>

                <div className="flex-1 p-6 md:p-12 overflow-y-auto">
                    {/* Step 1: Select Role */}
                    {currentStep === 0 && (
                        <div className="h-full flex flex-col min-w-0">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-mono">SELECT_ROLE</h3>
                            <p className="text-slate-500 mb-8 font-mono text-sm">Target objective for new agent instance.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                                {ROLES.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={cn(
                                            "p-4 sm:p-6 border-2 text-left transition-all hover:bg-slate-50 group w-full",
                                            selectedRole === role.id 
                                                ? "border-brand bg-brand-light/30" 
                                                : "border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 flex items-center justify-center mb-4 transition-colors",
                                            selectedRole === role.id ? "bg-brand text-white" : "bg-white text-slate-400 group-hover:text-brand shadow-sm border border-slate-200"
                                        )}>
                                            <role.icon size={24} />
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-lg mb-1 font-mono">{role.title}</h4>
                                        <p className="text-sm text-slate-500">{role.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Connect Data */}
                    {currentStep === 1 && (
                        <div className="h-full flex flex-col min-w-0">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-mono">DATA_INGESTION</h3>
                            <p className="text-slate-500 mb-8 font-mono text-sm">Provide source URL for knowledge base training.</p>
                            
                            <div className="space-y-6 sm:space-y-8 max-w-lg mx-auto w-full my-auto px-1">
                                <div className="relative group">
                                    <label className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wide font-mono">SOURCE_URL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Globe className="text-slate-400 group-focus-within:text-brand transition-colors" size={20} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://your-business.com" 
                                            className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 pl-12 pr-4 py-4 focus:ring-0 focus:border-brand outline-none transition-all font-mono font-medium rounded-none"
                                        />
                                    </div>
                                </div>
                                
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>

                                <div className="flex justify-center">
                                        <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-brand rounded-none w-full h-12">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Upload Documents
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Identity & Launch */}
                    {currentStep === 2 && !isFinished && (
                        <div className="h-full flex flex-col min-w-0">
                            {isTraining ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-24 h-24 mb-8">
                                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-brand border-r-brand border-b-transparent border-l-transparent rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="text-brand animate-pulse fill-brand" size={32} />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Training your AI...</h3>
                                    <p className="text-slate-500 animate-pulse">Reading website content • Analyzing tone • Generating responses</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col min-w-0">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Name your Agent</h3>
                                    <p className="text-slate-500 mb-8">Give your new AI employee a name.</p>
                                    
                                    <div className="max-w-md mx-auto w-full my-auto space-y-6 px-1">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block uppercase tracking-wide">Agent Name</label>
                                            <input 
                                                type="text" 
                                                value={botName}
                                                onChange={(e) => setBotName(e.target.value)}
                                                placeholder="e.g. Maya Support" 
                                                className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-none px-4 py-4 focus:ring-0 focus:border-brand outline-none transition-all font-medium text-lg"
                                            />
                                        </div>

                                        <div className="bg-brand-light/50 p-6 rounded-none border border-brand/20 flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center shadow-sm text-brand border border-brand/10">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-brand-dark">Preview</div>
                                                <div className="text-lg font-bold text-slate-900">{botName || "Agent Name"}</div>
                                                <div className="text-xs text-slate-500">{selectedRole ? ROLES.find(r => r.id === selectedRole)?.title : "Agent Role"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Final Success Screen */}
                    {isFinished && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-8">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-xl shadow-green-100/50">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-4">Pixi is Ready!</h3>
                            <p className="text-slate-600 max-w-sm mx-auto mb-8 text-lg">
                                Your custom agent <strong>{botName}</strong> has been trained on <strong>{url || "your data"}</strong> and is ready.
                            </p>
                            <div className="flex gap-4">
                                    <Button 
                                    size="lg" 
                                    onClick={() => setShowTestChat(true)}
                                    className="bg-brand hover:bg-brand-dark shadow-xl shadow-brand/20 rounded-none h-12 px-8"
                                >
                                    Test Agent Now
                                    <ArrowRight size={18} className="ml-2" />
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-none h-12 px-8">Embed Code</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {!isFinished && !isTraining && (
                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center px-8 md:px-12">
                         <Button 
                            variant="ghost" 
                            disabled={currentStep === 0}
                            onClick={handleBack}
                            className="text-slate-500 hover:text-slate-900 rounded-none"
                        >
                            Back
                        </Button>
                        <Button 
                            onClick={handleNext}
                            disabled={
                                (currentStep === 0 && !selectedRole) ||
                                (currentStep === 1 && !url && currentStep === 1) || 
                                (currentStep === 2 && !botName)
                            }
                            className="bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20 px-8 rounded-none"
                        >
                            {currentStep === 2 ? "Create Agent" : "Continue"}
                            <ChevronRight size={18} className="ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </section>
  )
}
