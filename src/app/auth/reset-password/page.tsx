"use client"

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Bot, Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing from the link URL.");
      return;
    }

    // Client-side validations
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!/\d/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center bg-red-500 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={28} />
            </div>
            <h2 className="text-2xl font-bold">Invalid Link</h2>
            <p className="text-white/80 text-sm mt-1">This password reset link is invalid or incomplete.</p>
          </div>
          <div className="p-8 text-center space-y-6">
            <p className="text-slate-500 text-sm">
              The reset token is missing. Please request a new password reset link from the forgot password page.
            </p>
            <div className="pt-2">
              <Link 
                href="/auth/forgot-password" 
                className="inline-flex items-center justify-center bg-brand hover:bg-brand-dark text-white font-bold h-10 px-6 rounded-lg text-sm transition-colors w-full"
              >
                Go to Forgot Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-brand text-white">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
             <Bot size={28} />
          </div>
          <h2 className="text-2xl font-bold">New Password</h2>
          <p className="text-white/80 text-sm mt-1">Choose a secure, strong password for your account.</p>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center animate-shake">
                    {error}
                </div>
            )}

            {success ? (
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                        <CheckCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">Password Updated!</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link 
                            href="/auth/signin" 
                            className="inline-flex items-center justify-center bg-brand hover:bg-brand-dark text-white font-bold h-11 px-8 rounded-lg text-sm transition-colors w-full"
                        >
                            Log In Now
                            <ArrowRight size={16} className="ml-2" />
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors"
                                placeholder="Min. 8 characters, include a number"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors"
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <Button className="w-full bg-brand hover:bg-brand-dark text-white font-bold h-11" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            <>
                                Reset Password
                                <ArrowRight size={16} className="ml-2" />
                            </>
                        )}
                    </Button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
