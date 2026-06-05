"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Copy, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import { TestWidgetLauncher } from "@/components/dashboard/TestWidgetLauncher";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { PRICING } from "@/lib/constants";

interface BotSettingsClientProps {
  initialBot: Record<string, any>;
  role: "admin" | "manager" | "viewer";
}

export default function BotSettingsClient({ initialBot, role }: BotSettingsClientProps) {
  const [bot, setBot] = useState<Record<string, any>>(initialBot);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(initialBot.systemPrompt || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();
  const id = bot._id;

  const isViewer = role === "viewer";
  const isAdmin = role === "admin";

  const handleSave = async () => {
    if (isViewer) {
      toast.error("Viewers do not have permission to change settings");
      return;
    }

    setIsSaving(true);
    try {
        const res = await fetch(`/api/bots/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemPrompt })
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
      if (isViewer) {
          toast.error("Viewers do not have permission to trigger payments");
          return;
      }

      setProcessingPayment(true);
      try {
          const res = await fetch("/api/checkout/razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ botId: id })
          });
          const data = await res.json();
          const order = data.order;

          if (!order) throw new Error(data.error || "Failed to create order");

          const options = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
              amount: order.amount,
              currency: order.currency,
              name: "Hey-Pixi",
              description: `Activate Bot: ${bot?.name}`,
              order_id: order.id,
              handler: async function (response: any) {
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
                      router.refresh();
                  } else {
                      toast.error("Payment verification failed");
                  }
              },
              theme: { color: "#3b82f6" }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();

      } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Something went wrong with the payment");
      } finally {
          setProcessingPayment(false);
      }
  };
    
  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can delete agents");
      return;
    }

    setIsDeleting(true);
    try {
        const res = await fetch(`/api/bots/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
            toast.success("Bot deleted successfully");
            router.push("/dashboard");
            router.refresh();
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
            <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Activate Your Agent</h3>
                    <p className="text-slate-600 text-sm">Pay a one-time setup fee of ₹{PRICING.BOT_ACTIVATION_AMOUNT_INR} to start capturing leads on your website.</p>
                </div>
                {!isViewer ? (
                    <Button 
                        onClick={handlePayment} 
                        disabled={processingPayment}
                        className="bg-brand hover:bg-brand-dark shrink-0 font-bold"
                    >
                        {processingPayment ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        Pay ₹{PRICING.BOT_ACTIVATION_AMOUNT_INR}
                    </Button>
                ) : (
                    <span className="text-slate-400 text-xs italic shrink-0">Payments restricted for Viewer role.</span>
                )}
            </div>
        )}

        {bot.isActive ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">Agent Configuration</h3>
                        <p className="text-slate-500 text-sm">Fine-tune how your AI agent behaves and interacts with users.</p>
                    </div>
                    {!isViewer && (
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-brand hover:bg-brand-dark font-bold"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            Save Settings
                        </Button>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-slate-900">
                                System Prompt
                            </label>
                            {isViewer && (
                                <span className="text-xs text-slate-400 italic font-medium">Read-only mode (Viewer)</span>
                            )}
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            disabled={isViewer}
                            className="w-full h-48 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none text-slate-700 font-mono text-sm disabled:opacity-80"
                        />
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-8 opacity-60 pointer-events-none grayscale-[0.5]">
                 <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-lg mb-4">Agent Configuration</h3>
                    <p className="text-slate-500 text-sm mb-6">Activate your agent to unlock configuration settings and lead notifications.</p>
                    <div className="h-40 bg-slate-50 rounded-xl border border-slate-200 border-dashed" />
                 </div>
            </div>
        )}

        {bot.isActive && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Embed Code</h3>
                <p className="text-slate-500 mb-6 text-sm">Copy and paste this snippet right before the closing HTML body tag on your website.</p>
                
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

        {/* Danger Zone: Only Admin role can access */}
        {isAdmin ? (
            <div className="mt-12 pt-8 border-t border-red-100 animate-in fade-in">
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
                
                <DeleteConfirmModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                    title="Delete this agent?"
                    description="Are you absolutely sure? This will permanently delete this bot and all its associated leads, chat transcripts, and payment information. This action cannot be undone."
                />
            </div>
        ) : (
            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-sm italic font-medium">Danger Zone actions are restricted to Administrator accounts.</p>
            </div>
        )}
    </div>
  );
}
