"use client"

import { useState } from "react"
import { Phone, Mail, Clock, MessageSquare, Bot, User, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Lead {
    _id: string;
    name?: string;
    phone?: string;
    email?: string;
    lastMessage: string;
    transcript: Array<{ text: string, sender: 'user' | 'bot' }>;
    status: string;
    createdAt: string;
    botId?: { _id: string, name: string };
}

interface LeadsClientProps {
    initialLeads: Lead[];
}

export function LeadsClient({ initialLeads }: LeadsClientProps) {
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
        initialLeads.length > 0 ? initialLeads[0]._id : null
    );

    const selectedLead = initialLeads.find(l => l._id === selectedLeadId);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Side: Lead List */}
            <div className="xl:col-span-1 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {initialLeads.map(lead => (
                    <button
                        key={lead._id}
                        onClick={() => setSelectedLeadId(lead._id)}
                        className={cn(
                            "bg-white border text-left w-full border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/20",
                            selectedLeadId === lead._id ? "border-brand ring-1 ring-brand ring-offset-0" : "hover:border-slate-300"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900 truncate pr-2">{lead.name || "Unknown"}</h4>
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                lead.status === 'new' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            )}>
                                {lead.status}
                            </span>
                        </div>
                        <div className="space-y-1.5 text-sm text-slate-600 mb-4">
                            {lead.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" />
                                    <span className="truncate">{lead.phone}</span>
                                </div>
                            )}
                            {lead.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{lead.email}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(lead.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                                <Bot size={12} />
                                {lead.botId?.name || "Agent"}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Right Side: Chat Transcript Viewer */}
            <div className="xl:col-span-2 hidden xl:block">
                {selectedLead ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden max-h-[calc(100vh-250px)]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedLead.name || "Conversation Details"}</h3>
                                    <p className="text-xs text-slate-500">Started on {new Date(selectedLead.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-500">
                                ID: {selectedLead._id.slice(-6)}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {selectedLead.transcript && selectedLead.transcript.length > 0 ? (
                                selectedLead.transcript.map((msg, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "flex gap-3 max-w-[85%]",
                                            msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                            msg.sender === 'user' ? "bg-slate-800 text-white" : "bg-brand text-white shadow-sm"
                                        )}>
                                            {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                                            msg.sender === 'user' 
                                                ? "bg-white border-slate-200 text-slate-700 rounded-tr-none" 
                                                : "bg-brand text-white border-brand rounded-tl-none"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                    <MessageSquare size={32} className="opacity-20" />
                                    <p>No transcript available for this lead</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 h-full flex flex-col items-center justify-center text-slate-500 text-center">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                            <ChevronRight size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Select a lead to view transcript</h3>
                        <p className="max-w-xs mx-auto">Get full context by reviewing exactly how your AI agent interacted with this visitor.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
