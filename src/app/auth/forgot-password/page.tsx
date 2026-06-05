"use client"

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-brand text-white">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
             <Bot size={28} />
          </div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-white/80 text-sm mt-1">We will send you a link to reset your password.</p>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
                    {error}
                </div>
            )}

            {success ? (
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                        <CheckCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">Email Sent!</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            If an account is associated with <strong>{email}</strong>, a password reset link has been sent. Please check your inbox and spam folder.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link 
                            href="/auth/signin" 
                            className="inline-flex items-center text-brand font-bold hover:underline text-sm"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Log In
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button className="w-full bg-brand hover:bg-brand-dark text-white font-bold h-11" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending Link...
                            </>
                        ) : (
                            <>
                                Send Reset Link
                                <ArrowRight size={16} className="ml-2" />
                            </>
                        )}
                    </Button>

                    <div className="text-center mt-6">
                        <Link 
                            href="/auth/signin" 
                            className="inline-flex items-center text-slate-500 hover:text-brand font-semibold text-sm transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Log In
                        </Link>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
