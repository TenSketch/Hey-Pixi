"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export function ChatWindow({ botId, botName, themeColor = "#0f172a" }: { botId: string, botName: string, themeColor?: string }) {
    const [messages, setMessages] = useState([{ id: 1, text: `Hello! I am ${botName}. How can I help you today?`, sender: 'bot' }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        // Filter messages to pass string history to backend
        const history = messages.map(m => ({ text: m.text, sender: m.sender }));

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/chat';
            const res = await fetch(apiUrl, {
                method: 'POST',
                body: JSON.stringify({
                    message: userMsg.text,
                    botId,
                    history
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { id: Date.now() + 1, text: data.result, sender: 'bot' }]);
        } catch {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Connection error.", sender: 'bot' }]);
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
                    <div key={i} className={cn("flex w-full", m.sender === 'user' ? "justify-end" : "justify-start")}>
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
                                <ReactMarkdown>{m.text}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex w-full justify-start">
                         <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm flex gap-1 items-center h-[42px]">
                             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"/>
                             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"/>
                             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"/>
                         </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-100 border-none px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors rounded-full"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full shadow-sm text-white shrink-0" 
                    style={{ backgroundColor: themeColor }}
                    disabled={isLoading}
                >
                    <Send size={16} />
                </Button>
            </form>
        </div>
    );
}
