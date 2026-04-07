'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/Button"
import { AlertCircle, RotateCcw, Home } from "lucide-react"
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-red-100/50 animate-bounce">
        <AlertCircle size={40} />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
        A Core Logic <span className="text-red-600 underline">ERROR</span> Has Occurred.
      </h1>
      
      <p className="text-slate-600 text-lg max-w-md mb-10 font-medium">
        Something went wrong. Don&apos;t worry, Pixi is still in development. Let&apos;s try to reset the environment.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()}
          size="lg"
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-none h-12 px-8 flex gap-2 items-center shadow-lg"
        >
          <RotateCcw size={18} />
          Reset Runtime
        </Button>
        <Link href="/">
          <Button 
            variant="outline"
            size="lg"
            className="border-slate-300 text-slate-600 hover:bg-white hover:text-slate-900 rounded-none h-12 px-8 flex gap-2 items-center"
          >
            <Home size={18} />
            Back Home
          </Button>
        </Link>
      </div>

      {error.digest && (
        <p className="mt-12 text-xs font-mono text-slate-400">
          DIGEST_ID: {error.digest}
        </p>
      )}
    </div>
  )
}
