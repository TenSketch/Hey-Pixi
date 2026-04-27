"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { motion, AnimatePresence } from "framer-motion";
import { LeadCaptureForm } from "./LeadCaptureForm";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TO_SEND = 10;

export function ChatWindow({ botId, botName, themeColor = "#0f172a" }: { botId: string, botName: string, themeColor?: string }) {
    const [messages, setMessages] = useState([{ id: 1, text: `Hello! I am ${botName}. How can I help you today?`, sender: 'bot' }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        // Prevent sending if loading or input is empty
        if (isLoading || !input.trim()) return;

        const userMsg = { id: Date.now(), text: input.trim(), sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        // Send only the last N messages to limit payload size
        const history = messages.slice(-MAX_HISTORY_TO_SEND).map(m => ({ text: m.text, sender: m.sender }));

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/chat';
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMsg.text,
                    botId,
                    history
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Connection error.");
            }

            const data = await res.json();
            setMessages(prev => [...prev, { id: Date.now() + 1, text: data.result, sender: 'bot' }]);
        } catch (error: unknown) {
            console.error("Chat Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Connection error.";
            setMessages(prev => [...prev, { id: Date.now() + 1, text: errorMessage, sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 shadow-sm z-10" style={{ backgroundColor: themeColor }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 flex items-center justify-center text-white rounded-lg shadow-sm">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm leading-tight">{botName}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-medium">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"/> Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((m, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        key={i} 
                        className={cn("flex w-full", m.sender === 'user' ? "justify-end" : "justify-start")}
                    >
                        <div className={cn(
                            "max-w-[85%] p-3 text-sm shadow-sm rounded-2xl",
                            m.sender === 'user' 
                                ? "text-white rounded-br-sm" 
                                : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                        )}
                        style={m.sender === 'user' ? { backgroundColor: themeColor } : {}}
                        >
                            <div className={cn(
                                "prose prose-sm max-w-none",
                                m.sender === 'user' ? "prose-invert" : "prose-slate"
                            )}>
                                {/* SECURITY: Using rehype-sanitize to prevent XSS from AI prompt injection */}
                                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                                    {m.text.replace(/\[\[BUTTON: (.*?)\]\]/g, "").trim()}
                                </ReactMarkdown>
                            </div>
                            
                            {/* Render Buttons if any */}
                            {m.sender === 'bot' && m.text.includes("[[BUTTON: ") && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {Array.from(m.text.matchAll(/\[\[BUTTON: (.*?)\]\]/g)).map((match, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedService(match[1])}
                                            className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:bg-slate-50 active:scale-95"
                                            style={{ borderColor: themeColor, color: themeColor }}
                                        >
                                            {match[1]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex w-full justify-start"
                    >
                         <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm flex gap-1 items-center h-[42px]">
                             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"/>
                             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"/>
                             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"/>
                         </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder={isLoading ? "Please wait..." : "Type your message..."}
                    disabled={isLoading}
                    className="flex-1 bg-slate-100 border-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors rounded-full disabled:opacity-50"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full shadow-sm text-white shrink-0" 
                    style={{ backgroundColor: themeColor }}
                    disabled={isLoading || !input.trim()}
                >
                    <Send size={16} />
                </Button>
            </form>

            {/* Lead Capture Overlay */}
            <AnimatePresence>
                {selectedService && (
                    <LeadCaptureForm 
                        botId={botId}
                        selectedService={selectedService}
                        themeColor={themeColor}
                        onClose={() => setSelectedService(null)}
                        onSuccess={() => {
                            setMessages(prev => [...prev, { 
                                id: Date.now(), 
                                text: `I have selected: ${selectedService}. My details have been submitted!`, 
                                sender: 'user' 
                            }]);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
