
"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function ParallaxBackground() {
  const blob1Ref = useRef<HTMLDivElement>(null)
  const blob2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const blob1 = blob1Ref.current
    const blob2 = blob2Ref.current

    if (!blob1 || !blob2) return

    gsap.to(blob1, {
      y: 300,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    })

    gsap.to(blob2, {
      y: -200,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    })
    
    return () => {
        ScrollTrigger.getAll().forEach(t => t.kill());
    }
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-50 overflow-hidden">
      <div 
        ref={blob1Ref} 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-light/20 rounded-full blur-[100px] opacity-40" 
      />
      <div 
        ref={blob2Ref} 
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-brand-accent/10 rounded-full blur-[120px] opacity-30" 
      />
    </div>
  )
}
