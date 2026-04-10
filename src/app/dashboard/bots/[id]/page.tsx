"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Copy, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import Script from "next/script";
import { TestWidgetLauncher } from "@/components/dashboard/TestWidgetLauncher";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  theme: { color: string };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

export default function BotSettingsPage() {
  const { id } = useParams() as { id: string };
  const [bot, setBot] = useState<Record<string, string | boolean>>();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [whatsAppOptIn, setWhatsAppOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/bots/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.bot) {
                setBot(data.bot);
                setSystemPrompt(data.bot.systemPrompt || "");
                setNotificationPhone(data.bot.notificationPhone || "");
                setWhatsAppOptIn(data.bot.whatsAppOptIn || false);
            }
            setLoading(false);
        });
  }, [id]);

  const handleSave = async () => {
    // Client-side validation
    if (notificationPhone.trim() && !whatsAppOptIn) {
        toast.error("You must agree to the WhatsApp opt-in policy to enable notifications.");
        return;
    }

    setIsSaving(true);
    try {
        const res = await fetch(`/api/bots/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemPrompt, notificationPhone, whatsAppOptIn })
        });
        const data = await res.json();
        if (data.success) {
            toast.success("Settings saved successfully!");
        } else {
            toast.error(data.error || "Failed to save settings");
        }
    } catch (err) {
        console.error(err);
        toast.error("Something went wrong while saving");
    } finally {
        setIsSaving(false);
    }
  };

  const handlePayment = async () => {
      setProcessingPayment(true);
      try {
          const res = await fetch("/api/checkout/razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ botId: id })
          });
          const { order } = await res.json();

          if (!order) throw new Error("Failed to create order");

          const options: RazorpayOptions = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
              amount: order.amount,
              currency: order.currency,
              name: "Hey-Pixi",
              description: `Activate Bot: ${bot?.name}`,
              order_id: order.id,
              handler: async function (response: RazorpayResponse) {
                  const verifyRes = await fetch("/api/checkout/razorpay/verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          botId: id
                      })
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                      setBot(prev => prev ? { ...prev, isActive: true } : prev);
                      toast.success("Agent activated successfully!");
                  } else {
                      toast.error("Payment verification failed");
                  }
              },
              theme: { color: "#3b82f6" }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();

      } catch (err) {
          console.error(err);
          toast.error("Something went wrong with the payment");
      } finally {
          setProcessingPayment(false);
      }
  };
    
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/bots/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
            toast.success("Bot deleted successfully");
            router.push("/dashboard");
        } else {
            toast.error(data.error || "Failed to delete bot");
            setIsDeleteModalOpen(false);
        }
    } catch (err) {
        console.error(err);
        toast.error("Something went wrong while deleting");
        setIsDeleteModalOpen(false);
    } finally {
        setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  if (!bot) return <div>Bot not found</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-20">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{bot.name}</h2>
                <p className="text-slate-500 capitalize">{bot.role} Agent</p>
            </div>
            {bot.isActive ? (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                    <CheckCircle2 size={16} className="mr-1" /> Active
                </div>
            ) : (
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Inactive (Requires Payment)
                    </div>
            )}
        </div>

        {!bot.isActive && (
            <div className="bg-brand-light/30 border border-brand/20 p-6 rounded-xl flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Activate Your Agent</h3>
                    <p className="text-slate-600">Pay a one-time setup fee of ₹1999 to start capturing leads on your website.</p>
                </div>
                <Button 
                    onClick={handlePayment} 
                    disabled={processingPayment}
                    className="bg-brand hover:bg-brand-dark"
                >
                    {processingPayment ? <Loader2 className="animate-spin mr-2" /> : null}
                    Pay ₹1999
                </Button>
            </div>
        )}

        {bot.isActive && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">Agent Configuration</h3>
                        <p className="text-slate-500 text-sm">Fine-tune how your AI agent behaves and interacts with users.</p>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-brand hover:bg-brand-dark"
                    >
                        {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Save Settings
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            System Prompt
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none text-slate-700 font-sans"
                            placeholder="Example: You are a friendly customer support agent for Pixi Labs. Your goal is to capture the user's name and phone number."
                        />
                        <p className="mt-2 text-xs text-slate-400">
                            This prompt defines the AI&apos;s personality, knowledge, and goals. Be as specific as possible.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            WhatsApp Notification Number
                        </label>
                        <input
                            type="text"
                            value={notificationPhone}
                            onChange={(e) => {
                                setNotificationPhone(e.target.value);
                                // If user clears the phone number, uncheck opt-in
                                if (!e.target.value.trim()) {
                                    setWhatsAppOptIn(false);
                                }
                            }}
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-slate-700 font-sans"
                            placeholder="e.g. +919876543210"
                        />
                        <p className="mt-2 text-xs text-slate-400">
                            Enter the WhatsApp number where you want to receive lead notifications. Include country code.
                        </p>
                    </div>

                    {/* WhatsApp Opt-In Consent Checkbox - required when phone is provided */}
                    {notificationPhone.trim() && (
                        <div className={`p-4 rounded-xl border transition-all ${whatsAppOptIn ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={whatsAppOptIn}
                                    onChange={(e) => setWhatsAppOptIn(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20 accent-brand shrink-0"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-700 block">
                                        I agree to receive WhatsApp notifications {" "}
                                        <span className="text-red-500">*</span>
                                    </span>
                                    <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
                                        By checking this box, I confirm that I want to receive lead alerts and notifications from Hey-Pixi on this WhatsApp number. 
                                        I understand that I am providing my consent to receive these automated messages.
                                    </span>
                                    {whatsAppOptIn && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <span className="text-sm font-medium text-blue-800 block mb-1">
                                                Required: Complete Gupshup Opt-in
                                            </span>
                                            <span className="text-xs text-blue-700 block">
                                                To actually receive messages, you MUST click this link and send the pre-filled message from your WhatsApp number:
                                                <br />
                                                <a 
                                                    href="https://apps.gupshup.io/whatsapp/optin?bId=2b0c4374-a2b5-4c2a-ae31-a98bebc9365b&bName=heypixi&s=URL&lang=en_US" 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="font-bold underline text-blue-600 hover:text-blue-800 mt-1 inline-block"
                                                >
                                                    Click here to Opt-in via WhatsApp
                                                </a>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        )}

        {bot.isActive && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Embed Code</h3>
                <p className="text-slate-500 mb-6 text-sm">Copy and paste this snippet right before the closing code tag on your website.</p>
                
                <div className="bg-slate-50 p-5 rounded-xl flex items-center justify-between font-mono text-sm border border-slate-200 group transition-all hover:border-brand/30">
                    <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-bot-id="${id}"></script>`}
                    </pre>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-brand hover:bg-brand-light/30 ml-4 shrink-0 transition-colors" 
                        onClick={() => {
                            navigator.clipboard.writeText(`<script src="${window.location.origin}/widget.js" data-bot-id="${id}"></script>`);
                            toast.success("Embed code copied to clipboard!");
                        }}
                    >
                        <Copy size={18} />
                    </Button>
                </div>
            </div>
        )}

        {bot.isActive && <TestWidgetLauncher botId={id} />}

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-red-100">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-900 text-lg mb-1">Danger Zone</h3>
                        <p className="text-red-700/70 text-sm mb-6">
                            Once you delete a bot, there is no going back. All leads, transcripts, and payment information associated with this agent will be permanently removed.
                        </p>
                        <Button 
                            variant="destructive" 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-200"
                        >
                            <Trash2 size={18} className="mr-2" />
                            Delete this Agent
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <DeleteConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            title="Delete this agent?"
            description="Are you absolutely sure? This will permanently delete this bot and all its associated leads, chat transcripts, and payment information. This action cannot be undone."
        />
    </div>
  );
}
