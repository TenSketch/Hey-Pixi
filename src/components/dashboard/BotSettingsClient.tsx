"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle2, Copy, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import { TestWidgetLauncher } from "@/components/dashboard/TestWidgetLauncher";
import { deleteBot, updateBotSettings } from "@/lib/actions/bot-actions";
import { useRouter } from "next/navigation";

interface BotSettingsClientProps {
    bot: Record<string, string | boolean>;
    id: string;
    razorpayKey: string | undefined;
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export function BotSettingsClient({ bot: initialBot, id, razorpayKey }: BotSettingsClientProps) {
    const router = useRouter();
    const [bot, setBot] = useState(initialBot);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const result = await updateBotSettings(id, {
                notificationPhone: bot.notificationPhone as string,
                whatsAppOptIn: bot.whatsAppOptIn as boolean
            });
            if (result.success) {
                toast.success("Notification settings updated!");
            } else {
                toast.error(result.error || "Failed to update settings");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while saving");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
        
        setIsDeleting(true);
        try {
            const result = await deleteBot(id);
            if (result.success) {
                toast.success("Agent deleted successfully");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete bot");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while deleting");
        } finally {
            setIsDeleting(false);
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

            const options = {
                key: razorpayKey, 
                amount: order.amount,
                currency: order.currency,
                name: "Hey-Pixi",
                description: `Activate Bot: ${bot.name}`,
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
                        setBot({ ...bot, isActive: true });
                        toast.success("Agent activated successfully!");
                    } else {
                        toast.error("Payment verification failed");
                    }
                },
                theme: { color: "#3b82f6" }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error(err);
            toast.error("Something went wrong initializing payment");
        } finally {
            setProcessingPayment(false);
        }
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="space-y-8">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{bot.name}</h2>
                    <p className="text-slate-500 capitalize">{bot.role} Agent</p>
                </div>
                {bot.isActive ? (
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                            <CheckCircle2 size={16} className="mr-1" /> Active
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                            Inactive (Requires Payment)
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </Button>
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
                    <h3 className="font-bold text-slate-900 text-lg mb-2">Embed Code</h3>
                    <p className="text-slate-500 mb-6 text-sm">Copy and paste this snippet right before the closing <code className="bg-slate-100 text-brand px-1.5 py-0.5 rounded font-bold">&lt;/body&gt;</code> tag on your website.</p>
                    
                    <div className="bg-slate-50 p-5 rounded-xl flex items-center justify-between font-mono text-sm border border-slate-200 group transition-all hover:border-brand/30">
                        <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
{`<script src="${origin}/widget.js" data-bot-id="${id}"></script>`}
                        </pre>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-brand hover:bg-brand-light/30 ml-4 shrink-0 transition-colors" 
                            onClick={() => {
                                navigator.clipboard.writeText(`<script src="${origin}/widget.js" data-bot-id="${id}"></script>`);
                                toast.success("Embed code copied to clipboard!");
                            }}
                        >
                            <Copy size={18} />
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <MessageCircle size={20} className="text-brand" />
                    WhatsApp Lead Alerts
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Notification Phone Number</label>
                        <input 
                            type="text" 
                            placeholder="+91 99999 99999"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none transition-all"
                            value={(bot.notificationPhone as string) || ""}
                            onChange={(e) => setBot({ ...bot, notificationPhone: e.target.value })}
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Enter the number where you want to receive lead alerts via WhatsApp.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-brand-light/30 rounded-xl border border-brand/10">
                        <input 
                            type="checkbox" 
                            id="whatsapp-optin"
                            className="w-4 h-4 text-brand rounded focus:ring-brand"
                            checked={!!bot.whatsAppOptIn}
                            onChange={(e) => setBot({ ...bot, whatsAppOptIn: e.target.checked })}
                        />
                        <label htmlFor="whatsapp-optin" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                            Enable real-time WhatsApp alerts for new leads
                        </label>
                    </div>

                    <Button 
                        className="bg-brand hover:bg-brand-dark"
                        disabled={isSavingSettings}
                        onClick={handleSaveSettings}
                    >
                        {isSavingSettings ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        Save Notification Settings
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-4">System Prompt</h3>
                <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm min-h-[200px]"
                    defaultValue={bot.systemPrompt as string}
                    disabled
                />
                <p className="text-xs text-slate-500 mt-2">To edit your system prompt, please contact support or delete and recreate the bot.</p>
            </div>

            {bot.isActive && <TestWidgetLauncher botId={id} />}
        </div>
    );
}
