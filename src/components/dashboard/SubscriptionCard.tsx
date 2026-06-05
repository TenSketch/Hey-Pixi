"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, Loader2, Sparkles, CreditCard, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  user: {
    _id: string;
    email: string;
    subscriptionPlan: "free" | "pro";
    tokenUsage: number;
    tokenLimit: number;
    subscriptionStatus: "active" | "warning_sent" | "exhausted" | "past_due";
    paymentMandateId?: string;
    autoRenew: boolean;
  };
  role: "admin" | "manager" | "viewer";
}

export function SubscriptionCard({ user, role }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedCard, setSimulatedCard] = useState("");
  const [simulatedName, setSimulatedName] = useState("");
  const router = useRouter();

  const isViewer = role === "viewer";
  const tokenUsage = user.tokenUsage !== undefined && !isNaN(user.tokenUsage) ? user.tokenUsage : 0;
  const tokenLimit = user.tokenLimit || 100;
  const usagePercentage = Math.min(100, Math.round((tokenUsage / tokenLimit) * 100));
  const isNearLimit = usagePercentage >= 85;

  const handleRazorpayUpgrade = async () => {
    if (isViewer) {
      toast.error("Viewers do not have permission to subscribe to plans");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Subscription creation failed");
      }

      // Initialize Razorpay subscription checkout
      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Hey-Pixi Premium",
        description: "Monthly Pro Subscription (Standing Instructions Autopay)",
        handler: function (response: any) {
          toast.success("Subscription initialized successfully!");
          router.refresh();
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to launch Razorpay subscription popup");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      toast.error("Viewers do not have permission to subscribe");
      return;
    }

    setLoading(true);
    setShowSimulatedModal(false);

    try {
      // Send a mock successful subscription event to the webhook
      const mockWebhookPayload = {
        event: "subscription.charged",
        payload: {
          subscription: {
            entity: {
              id: "sub_mock_" + Math.random().toString(36).substr(2, 9),
              notes: {
                userId: user._id,
              },
            },
          },
          payment: {
            entity: {
              id: "pay_mock_" + Math.random().toString(36).substr(2, 9),
              amount: 199900,
              currency: "INR",
            },
          },
        },
      };

      const res = await fetch("/api/webhook/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockWebhookPayload),
      });

      if (res.ok) {
        toast.success("Mandate Authorized!", {
          description: "Simulated standing instructions set up successfully. Plan upgraded to Pro.",
        });
        router.refresh();
      } else {
        toast.error("Simulation failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (isViewer) {
      toast.error("Viewers do not have permission to cancel subscription");
      return;
    }

    setLoading(true);
    try {
      // Call mock webhook cancel event
      const mockCancelPayload = {
        event: "subscription.cancelled",
        payload: {
          subscription: {
            entity: {
              notes: {
                userId: user._id,
              },
            },
          },
        },
      };

      const res = await fetch("/api/webhook/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockCancelPayload),
      });

      if (res.ok) {
        toast.success("Subscription cancelled successfully");
        router.refresh();
      } else {
        toast.error("Failed to cancel subscription");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Token Usage Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Message Token Balance</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">Used messages</span>
            <span className="font-bold text-slate-800">
              {tokenUsage} / {tokenLimit}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              style={{ width: `${usagePercentage}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isNearLimit ? "bg-amber-500" : usagePercentage >= 100 ? "bg-red-500" : "bg-brand"
              )}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 font-medium">Plan: {(user.subscriptionPlan || "free").toUpperCase()}</span>
            {isNearLimit && (user.subscriptionPlan || "free") === "free" && (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> Limit reaching soon! Please upgrade.
              </span>
            )}
            {tokenUsage >= tokenLimit && (
              <span className="text-red-500 font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> Limit exhausted. AI responses blocked.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Management Card */}
      {user.subscriptionPlan === "free" ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          {/* Decorative Sparkle Gradient */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Upgrade to Pro Plan</h3>
              <p className="text-slate-500 text-sm mt-0.5">Scale your lead capture with auto-renewing standing instructions.</p>
            </div>

            {/* Pricing details */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900">₹1,999</span>
              <span className="text-slate-500 text-sm font-semibold">/ month</span>
            </div>

            {/* Benefits list */}
            <ul className="space-y-2.5 text-slate-600 text-sm">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-brand shrink-0" />
                <span><strong>10,000 Message Queries</strong> per month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-brand shrink-0" />
                <span>Unlimited AI Assistants & Deploys</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-brand shrink-0" />
                <span>Auto-recurring monthly billing (Standing instructions)</span>
              </li>
            </ul>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2 w-full">
              <Button
                onClick={handleRazorpayUpgrade}
                disabled={loading || isViewer}
                className="bg-brand hover:bg-brand-dark text-white font-bold h-11 px-6 shadow-md shadow-brand/10 w-full justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Subscribe via Razorpay
              </Button>
              <Button
                onClick={() => {
                  if (isViewer) toast.error("Viewers cannot simulate upgrades");
                  else setShowSimulatedModal(true);
                }}
                disabled={loading || isViewer}
                variant="outline"
                className="border-slate-200 hover:bg-slate-50 font-bold h-11 px-6 w-full text-slate-700 justify-center"
              >
                Simulate Mandate Setup (Test)
              </Button>
            </div>
            {isViewer && (
              <p className="text-xs text-slate-400 italic">Upgrade triggers are disabled for Viewer role.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Pro Plan Active</h3>
                <p className="text-slate-500 text-sm mt-0.5">Your automated standing instructions mandate is active and renewing.</p>
              </div>

              {/* Mandate details card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Payment Cycle:</span>
                  <span className="text-slate-700 font-bold">Monthly Recurring</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Status:</span>
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Mandate ID:</span>
                  <span className="font-mono text-slate-600 text-xs truncate max-w-[180px]">
                    {user.paymentMandateId || "sub_mandate_active_recurring"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCancelSubscription}
                  disabled={loading || isViewer}
                  variant="destructive"
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold h-10 px-6 shadow-none flex-1"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Cancel Auto-Renew
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Standing Instruction Payment Mandate Modal */}
      {showSimulatedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="text-brand-light" size={20} />
                <h3 className="font-bold text-lg">Secure Mandate Checkout</h3>
              </div>
              <button
                onClick={() => setShowSimulatedModal(false)}
                className="text-white/60 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSimulatedUpgrade} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 leading-relaxed">
                <strong>Simulated Gateway:</strong> You are setting up a recurring monthly standing instruction mandate of <strong>₹1,999/month</strong>. The card will be simulated-charged immediately.
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={simulatedName}
                  onChange={(e) => setSimulatedName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4111 1111 1111 1111"
                    value={simulatedCard}
                    onChange={(e) => {
                      // format card format
                      const value = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                      setSimulatedCard(value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="•••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand text-center"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowSimulatedModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-bold h-11 px-8 rounded-xl shrink-0"
                >
                  Authorize Mandate (₹1,999)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
