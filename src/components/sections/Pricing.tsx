
"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/Button"
import { Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const PLANS = [
    {
        name: "Trial",
        price: "$0",
        period: "/14 days",
        desc: "Perfect for testing Pixi's capabilities.",
        features: ["1 Custom Agent", "50 Conversations", "Basic Analytics", "Community Support"],
        cta: "Start Free Trial",
        popular: false
    },
    {
        name: "Pro",
        price: "$29",
        period: "/seat/mo",
        desc: "Power for growing teams.",
        features: ["Unlimited Agents", "5,000 Conversations", "Advanced Analytics", "Email Support", "API Access"],
        cta: "Get Started",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        desc: "Scale with confidence.",
        features: ["Unlimited Volume", "Dedicated Instance", "SSO & Audit Logs", "24/7 Priority Support", "Custom Integrations"],
        cta: "Contact Sales",
        popular: false
    }
]

export function Pricing() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header Animation
            gsap.fromTo(".pricing-header",
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 70%",
                    }
                }
            )

            // Cards Animation (Staggered Entrance)
            gsap.fromTo(".pricing-card", 
                { y: 100, opacity: 0, rotateX: 10 },
                {
                    y: 0,
                    opacity: 1,
                    rotateX: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "back.out(1.2)",
                    scrollTrigger: {
                        trigger: cardsRef.current,
                        start: "top 75%",
                    }
                }
            )
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section id="pricing" ref={sectionRef} className="py-32 bg-slate-50 relative overflow-hidden scroll-mt-24">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20 max-w-2xl mx-auto pricing-header opacity-0">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900">
                        Simple, Transparent <span className="text-brand">Pricing</span>
                    </h2>
                    <p className="text-slate-600 text-lg">
                        Choose the perfect plan for your automated workforce. No hidden fees.
                    </p>
                </div>

                <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start perspective-1000">
                    {PLANS.map((plan, i) => (
                        <div 
                            key={i} 
                            className={cn(
                                "pricing-card group relative p-8 bg-white border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200 opacity-0",
                                plan.popular 
                                    ? "border-brand shadow-xl shadow-brand/10 z-10 scale-105 md:scale-110" 
                                    : "border-slate-100 hover:border-slate-300 shadow-lg shadow-slate-100"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-sky-500 text-white px-6 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
                                    <Sparkles size={12} className="fill-white" />
                                    <span>Most Popular</span>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={cn(
                                    "text-sm font-bold font-mono mb-4 uppercase tracking-wider",
                                    plan.popular ? "text-brand" : "text-slate-500"
                                )}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-5xl font-bold text-slate-900 tracking-tight">{plan.price}</span>
                                    {plan.period && <span className="text-slate-400 text-sm font-medium">{plan.period}</span>}
                                </div>
                                <p className="text-slate-500 text-sm">{plan.desc}</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feat, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-slate-700">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                            plan.popular ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                className={cn(
                                    "w-full rounded-none h-14 text-base font-bold tracking-wide transition-all",
                                    plan.popular 
                                        ? "bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30" 
                                        : "bg-slate-50 border-2 border-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                                )}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
