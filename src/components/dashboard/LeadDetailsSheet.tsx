"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { User, Bot, Clock, Phone, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

interface LeadDetailsSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailsSheet({ lead, isOpen, onClose }: LeadDetailsSheetProps) {
  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md xl:max-w-lg p-0 flex flex-col bg-slate-50 border-l border-slate-200">
        <SheetHeader className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center shadow-sm border border-brand/20">
                <User size={24} />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-slate-900">{lead.name || "Unknown Visitor"}</SheetTitle>
                <SheetDescription className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <Clock size={14} />
                  {new Date(lead.createdAt).toLocaleString()}
                </SheetDescription>
              </div>
            </div>
            <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="uppercase">
                {lead.status}
            </Badge>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-sm">
             {lead.phone && (
                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <Phone size={16} className="text-slate-400" />
                    <span className="font-medium">{lead.phone}</span>
                </div>
            )}
            {lead.email && (
                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <Mail size={16} className="text-slate-400" />
                    <span className="font-medium">{lead.email}</span>
                </div>
            )}
             {lead.botId && (
                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <Bot size={16} className="text-slate-400" />
                    <span className="font-medium text-brand">{lead.botId.name}</span>
                </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
           {lead.transcript && lead.transcript.length > 0 ? (
                lead.transcript.map((msg, idx) => (
                    <div 
                        key={idx}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            msg.sender === 'user' ? "bg-slate-800 text-white border-slate-900" : "bg-white text-brand border-slate-200"
                        )}>
                            {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                            msg.sender === 'user' 
                                ? "bg-slate-800 border-slate-800 text-white rounded-tr-none" 
                                : "bg-white border-slate-200 text-slate-700 rounded-tl-none"
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                        <MessageSquare size={24} className="opacity-50" />
                    </div>
                    <p>No transcript available</p>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
