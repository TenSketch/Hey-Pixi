
"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Bot, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const { status } = useSession()

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

        {/* Desktop Nav - Cleaned up to match single page gamified flow */}
        <div className="hidden md:flex items-center gap-8">
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
             {status === "unauthenticated" ? (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="text-slate-700 hover:text-brand hover:bg-brand-light">Log In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-full px-6 shadow-brand/25 shadow-lg">
                        Get Started
                    </Button>
                  </Link>
                </>
             ) : status === "loading" ? (
                <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-full" />
             ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-slate-700 hover:text-brand">Dashboard</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50">Sign Out</Button>
                </>
             )}
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
             {/* Mobile Nav - Cleaned up */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                 {status === "unauthenticated" ? (
                    <>
                      <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-slate-700">Log In</Button>
                      </Link>
                      <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-brand text-white font-bold">Get Your Pixi</Button>
                      </Link>
                    </>
                 ) : (
                    <>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-brand text-white text-left">Dashboard</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => signOut()} className="w-full justify-start text-slate-700">Sign Out</Button>
                    </>
                 )}
            </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
