"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X, Loader2, User, Mail, Phone, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VALIDATION } from "@/lib/constants";

interface LeadCaptureFormProps {
    botId: string;
    selectedService: string;
    themeColor: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function LeadCaptureForm({ botId, selectedService, themeColor, onClose, onSuccess }: LeadCaptureFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic validation
        if (!formData.name.trim()) return setError("Name is required");
        if (!formData.email.trim() && !formData.phone.trim()) return setError("Email or Phone is required");
        
        if (formData.email && !VALIDATION.EMAIL_REGEX.test(formData.email)) {
            return setError("Please enter a valid email address");
        }

        let normalizedPhone = formData.phone;
        if (formData.phone) {
            const cleanPhone = formData.phone.replace(/\D/g, "");
            let checkPhone = cleanPhone;
            if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
                checkPhone = cleanPhone.slice(2);
            } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
                checkPhone = cleanPhone.slice(1);
            }
            if (checkPhone.length !== 10) {
                return setError("Please enter a valid 10-digit mobile number");
            }
            normalizedPhone = checkPhone;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/leads/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    botId,
                    selectedService,
                    name: formData.name,
                    email: formData.email,
                    phone: normalizedPhone
                })
            });

            const data = await res.json();
            if (data.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                setError(data.error || "Failed to submit. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white flex flex-col"
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100" style={{ backgroundColor: `${themeColor}10` }}>
                    <div>
                        <h3 className="font-bold text-slate-900">Information Required</h3>
                        <p className="text-xs text-slate-500">Interested in: <span className="font-semibold text-brand" style={{ color: themeColor }}>{selectedService}</span></p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/50">
                        <X size={18} />
                    </Button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isSuccess ? (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg">Thank You!</h4>
                                <p className="text-sm text-slate-500">Your details have been saved. Our team will contact you shortly.</p>
                            </div>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <User size={12} /> Name
                                </label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm"
                                    placeholder="Your Full Name"
                                    style={{ '--tw-ring-color': themeColor } as any}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Mail size={12} /> Email Address
                                </label>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm"
                                    placeholder="example@email.com"
                                    style={{ '--tw-ring-color': themeColor } as any}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Phone size={12} /> Phone Number
                                </label>
                                <input 
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm"
                                    placeholder="+1 (555) 000-0000"
                                    style={{ '--tw-ring-color': themeColor } as any}
                                />
                            </div>

                            {error && (
                                <p className="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg text-center">
                                    {error}
                                </p>
                            )}

                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-6 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98]"
                                style={{ backgroundColor: themeColor }}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                                {isSubmitting ? "Submitting..." : "Submit Information"}
                            </Button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 text-center border-t border-slate-100 bg-slate-50">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Powered by Hey-Pixi</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
