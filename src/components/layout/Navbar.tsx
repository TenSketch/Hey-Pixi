
"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Bot, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20)
  })

  return (
    <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300",
            scrolled ? "bg-white/80 backdrop-blur-lg border-b border-slate-200" : "bg-transparent"
        )}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
             <div className="bg-brand text-white p-2 rounded-xl shadow-lg shadow-brand/20 transition-transform group-hover:scale-105">
                <Bot className="w-6 h-6" />
             </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">HeyPixi</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                Plugin Types
            </Link>
             <Link href="#demo" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                Live Demo
            </Link>
             <Link href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                Pricing
            </Link>
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
             <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-brand hover:bg-brand-light">Log In</Button>
             </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-full px-6 shadow-brand/25 shadow-lg">
                    Get Started
                </Button>
             </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

       {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 p-6 shadow-xl flex flex-col gap-4"
        >
             <Link href="#features" className="text-lg font-medium text-slate-800 p-2" onClick={() => setIsOpen(false)}>
                Plugin Types
            </Link>
             <Link href="#demo" className="text-lg font-medium text-slate-800 p-2" onClick={() => setIsOpen(false)}>
                Live Demo
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                 <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-slate-700">Log In</Button>
                </Link>
                 <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-brand text-white">Get Your Pixi</Button>
                </Link>
            </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
