"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { User, Bot, Clock, Phone, Mail, MessageSquare, ExternalLink, Loader2, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { updateLeadStatus } from "@/lib/actions/lead-actions";
import { toast } from "sonner";

export type LeadStatus = "closed" | "new" | "contacted" | "qualified" | "resolved";

interface Lead {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  lastMessage: string;
  transcript: Array<{ text: string, sender: 'user' | 'bot' }>;
  status: LeadStatus;
  createdAt: string;
  botId?: { _id: string, name: string };
}

interface LeadDetailsSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "contacted", label: "Contacted", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "qualified", label: "Qualified", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "closed", label: "Closed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "resolved", label: "Resolved", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

export function LeadDetailsSheet({ lead: initialLead, isOpen, onClose }: LeadDetailsSheetProps) {
  const [lead, setLead] = useState<Lead | null>(initialLead);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state when prop changes
  if (initialLead && (!lead || lead._id !== initialLead._id)) {
    setLead(initialLead);
  }

  if (!lead) return null;

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdating(true);
    try {
      const result = await updateLeadStatus(lead._id, newStatus);
      if (result.success) {
        setLead({ ...lead, status: newStatus });
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    // Remove non-numeric characters for the link
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Hi ${lead.name || "there"}, I'm following up from ${lead.botId?.name || "our website"}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

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
            <div className="flex flex-col items-end gap-2 pr-8">
                <div className="relative group">
                    <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                        disabled={isUpdating}
                        className={cn(
                            "appearance-none text-[10px] uppercase font-bold py-1.5 pl-3 pr-8 rounded-full border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/50 shadow-sm",
                            STATUS_OPTIONS.find(s => s.value === lead.status)?.color || "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
                        <ChevronDown size={12} strokeWidth={3} />
                    </div>
                </div>
                {isUpdating && <Loader2 size={12} className="animate-spin text-slate-400 mr-2" />}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
             {lead.phone && (
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group transition-all hover:border-brand/30">
                    <div className="flex items-center gap-3">
                        <Phone size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{lead.phone}</span>
                    </div>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs text-brand hover:text-brand-dark hover:bg-brand/10 gap-1.5"
                        onClick={handleWhatsApp}
                    >
                        <MessageCircle size={14} />
                        WhatsApp
                    </Button>
                </div>
            )}
            {lead.email && (
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group transition-all hover:border-brand/30">
                    <div className="flex items-center gap-3">
                        <Mail size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{lead.email}</span>
                    </div>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs text-brand hover:text-brand-dark hover:bg-brand/10 gap-1.5"
                        onClick={() => window.open(`mailto:${lead.email}`)}
                    >
                        <ExternalLink size={14} />
                        Email
                    </Button>
                </div>
            )}
             {lead.botId && (
                <div className="flex items-center gap-3 text-slate-500 px-3 py-1">
                    <Bot size={14} />
                    <span className="text-xs">Captured by <span className="font-bold text-slate-700">{lead.botId.name}</span></span>
                </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare size={14} />
                Conversation Transcript
            </h4>
           {lead.transcript && lead.transcript.length > 0 ? (
                lead.transcript.map((msg, idx) => (
                    <div 
                        key={idx}
                        className={cn(
                            "flex gap-3 max-w-[90%]",
                            msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            msg.sender === 'user' ? "bg-slate-800 text-white border-slate-900" : "bg-white text-brand border-slate-200"
                        )}>
                            {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <div className={cn(
                            "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm border",
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

