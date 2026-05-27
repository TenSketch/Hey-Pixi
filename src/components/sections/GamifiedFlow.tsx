"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import Script from "next/script"
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight, 
  Smile, 
  Flame, 
  User, 
  Mail, 
  Lock, 
  Loader2, 
  Check, 
  HelpCircle, 
  Phone, 
  FileText, 
  CheckCircle2, 
  RefreshCcw, 
  ExternalLink,
  Eye,
  EyeOff,
  PartyPopper
} from "lucide-react"

// Razorpay script loaded dynamically in render block

// Problem sets for Step 1
const PROBLEMS = [
  { id: "leads", emoji: "😤", text: "Not getting leads", color: "from-rose-500 to-orange-500" },
  { id: "repeated", emoji: "📞", text: "Too many repeated questions", color: "from-amber-500 to-yellow-500" },
]

// Step 2 Question Database
const QUESTIONS_BY_PROBLEM: Record<string, {
  questions: string[];
  options: string[][];
  replies: string[];
}> = {
  "leads": {
    questions: [
      "First off, what's your business niche? 🏢",
      "Got it! Where is most of your website traffic coming from today? 🚦",
      "And what's the #1 lead detail you want Pixi to collect from a visitor? 📥"
    ],
    options: [
      ["SaaS / Software", "E-commerce", "Local Business / Services", "Agency / Consulting"],
      ["Google / SEO", "Social Media", "Paid Ads", "Direct / Word of Mouth"],
      ["Email Address", "Phone & Name", "Budget & Requirement"]
    ],
    replies: [
      "Ah, the SaaS/consulting space is booming but competitive!",
      "Perfect. Driving traffic is hard, converting it shouldn't be.",
      "Smart. Let's build a bot that gets you exactly those details!"
    ]
  },
  "repeated": {
    questions: [
      "What category of repeated questions bugs you the most? 📞",
      "Where is your support content currently stored? 📚",
      "If Pixi handles 80% of these, how many hours would that save you weekly? ⏰"
    ],
    options: [
      ["Pricing & Plans", "Setup / How-tos", "Shipping & Delivery", "Booking consultations"],
      ["In my head / Slack", "Google Docs / FAQs page", "Nowhere, we answer live", " ticketing system"],
      ["5-10 hours", "10-20 hours", "20+ hours (We need a break!)"]
    ],
    replies: [
      "Ugh, answering the same question daily is a huge energy drain.",
      "We'll train Pixi directly on that source in seconds!",
      "Whoa! That's a massive productivity multiplier."
    ]
  },

  "automation": {
    questions: [
      "Which tool do you use the most that needs lead info? 🧾",
      "What is the most tedious manual task you do daily? ⚙️",
      "When a lead is captured, where should Pixi push it instantly? ⚡"
    ],
    options: [
      ["Google Sheets / Excel", "Zapier / Make", "CRM (Hubspot, etc.)", "Direct Email / Slack"],
      ["Copy-pasting details", "Sending welcome emails", "Scheduling calls", "Qualifying leads manually"],
      ["Instant Email / SMS alert", "Direct to CRM & Sheets", "Notify team on Slack"]
    ],
    replies: [
      "Awesome, Sheets/Zapier are perfect for automation.",
      "Manually doing that is a waste of your time!",
      "Done. Pixi will hook right into your workflow."
    ]
  }
}

// Conversation sequence for Step 3 Mock Bot
type ChatMsg = {
  id: number
  text: string
  sender: "bot" | "user"
}

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed("")
    setDone(false)
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse ml-0.5 text-brand">|</span>}
    </span>
  )
}

function PixiMascot({ size = "sm", mood = "idle" }: { size?: "sm" | "md" | "lg"; mood?: "idle" | "thinking" | "happy" }) {
  const sizeMap = { sm: "w-10 h-10 text-lg", md: "w-14 h-14 text-2xl", lg: "w-20 h-20 text-4xl" }
  const moodAnim = mood === "thinking" ? "animate-pulse-soft" : mood === "happy" ? "animate-bounce" : "animate-float"
  const emoji = mood === "thinking" ? "💭" : mood === "happy" ? "😊" : ""
  return (
    <div className="relative">
      {emoji && (
        <span className="absolute -top-2 -right-2 text-sm z-10 animate-bounce">{emoji}</span>
      )}
      <div className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br from-brand to-sky-500 flex items-center justify-center shadow-lg shadow-brand/25 ${moodAnim}`}>
        <span className="font-black tracking-tighter text-white drop-shadow-sm">P</span>
      </div>
    </div>
  )
}

function FloatingParticles({ count = 6 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 4,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-brand/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

export function GamifiedFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Selection states
  const [selectedProblem, setSelectedProblem] = useState<typeof PROBLEMS[0] | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  
  // Pixi dynamic statement in Step 2
  const [pixiReply, setPixiReply] = useState<string | null>(null)
  const [isQuestionTransitioning, setIsQuestionTransitioning] = useState(false)

  // Step 3 & 4 Mock Chat states
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [chatStage, setChatStage] = useState(0) // 0: Greet, 1: Ask Name, 2: Ask Phone, 3: Ask Req, 4: Done

  // Lead Card data (revealed value)
  const [leadName, setLeadName] = useState("")
  const [leadPhone, setLeadPhone] = useState("")
  const [leadReq, setLeadReq] = useState("")

  // Step 5 Unlock states
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "free" | null>(null)
  const [isAuthMode, setIsAuthMode] = useState<"signup" | "signin">("signup")
  
  // Auth Form inputs
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  // Final Payment state
  const [processingPayment, setProcessingPayment] = useState(false)
  const [createdBotId, setCreatedBotId] = useState<string | null>(null)
  const [checkoutComplete, setCheckoutComplete] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll chat window to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isBotTyping])

  // Initialize chatbot messages when Step 4 is reached
  useEffect(() => {
    if (step === 4 && chatMessages.length === 0) {
      setIsBotTyping(true)
      const timer = setTimeout(() => {
        let greeting = "Hi there! I'm your newly configured Pixi. 👋 "
        if (selectedProblem?.id === "leads") {
          greeting += "I'm primed and ready to capture high-value leads on your website! Shall we see how I qualify your visitors?"
        } else {
          greeting += "I'm trained on your documents and ready to answering support questions 24/7. Want to see a quick test?"
        }

        setChatMessages([
          { id: Date.now(), text: greeting, sender: "bot" },
          { id: Date.now() + 1, text: "Let's start! What is your name? 😊", sender: "bot" }
        ])
        setIsBotTyping(false)
        setChatStage(1) // Move to name question stage
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [step, chatMessages.length, selectedProblem])

  // Helper to handle Step 1 selection
  const handleProblemSelect = (problem: typeof PROBLEMS[0]) => {
    setSelectedProblem(problem)
    setAnswers([])
    setQuestionIndex(0)
    setStep(2)
  }

  // Helper to handle Step 2 selection
  const handleAnswerSelect = (option: string) => {
    if (isQuestionTransitioning) return

    const newAnswers = [...answers, option]
    setAnswers(newAnswers)

    const qSet = QUESTIONS_BY_PROBLEM[selectedProblem?.id || "leads"]
    const replyTemplate = qSet.replies[questionIndex]
    const customReply = replyTemplate.replace("$choice", option).replace("$industry", option)
    setPixiReply(customReply)
    setIsQuestionTransitioning(true)

    // Wait a brief period to show reply, then transition to next question or Step 3
    setTimeout(() => {
      setPixiReply(null)
      setIsQuestionTransitioning(false)
      if (questionIndex < 2) {
        setQuestionIndex(questionIndex + 1)
      } else {
        // Questions completed, transition to Demo!
        setStep(3)
      }
    }, 1800)
  }

  // Handle mock chat messages and dynamic lead-sheet updates
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsgText = chatInput.trim()
    const userMsg: ChatMsg = { id: Date.now(), text: userMsgText, sender: "user" }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput("")
    setIsBotTyping(true)

    setTimeout(() => {
      let botResponse = ""
      let nextStage = chatStage

      if (chatStage === 1) {
        // Name captured
        const name = userMsgText.replace(/my name is/i, "").replace(/i am/i, "").trim()
        setLeadName(name)
        botResponse = `Awesome to meet you, ${name}! 🎉 Next up, what's a good phone number where we can reach you? 📞`
        nextStage = 2
      } else if (chatStage === 2) {
        // Phone captured
        const cleanPhone = userMsgText.replace(/\D/g, "");
        let normalizedPhone = cleanPhone;
        if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
          normalizedPhone = cleanPhone.slice(2);
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
          normalizedPhone = cleanPhone.slice(1);
        }

        if (normalizedPhone.length !== 10) {
          botResponse = "Oops! Please provide a valid 10-digit mobile number so we can reach you. 📞"
          nextStage = 2 // Stay on phone capture stage
        } else {
          setLeadPhone(normalizedPhone)
          botResponse = "Got it! Lastly, briefly type out your main requirement or what you are looking for. 🚀"
          nextStage = 3
        }
      } else if (chatStage === 3) {
        // Requirement captured
        setLeadReq(userMsgText)
        botResponse = "Perfect! Look at that – I have successfully qualified your details and populated your lead card in real-time. Hit 'Next' below to unlock me on your website! 👇✨"
        nextStage = 4
      } else {
        botResponse = "I'm fully trained and ready! Click the 'Next Step' button below to launch me on your official website! 🚀"
      }

      setChatMessages(prev => [...prev, { id: Date.now(), text: botResponse, sender: "bot" }])
      setIsBotTyping(false)
      setChatStage(nextStage)
    }, 1000)
  }

  // Handle Sign-Up and Bot Provisioning + Payment
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setAuthLoading(true)

    try {
      if (isAuthMode === "signup") {
        // 1. Client side validation
        if (authPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long.")
        }
        if (!/\d/.test(authPassword)) {
          throw new Error("Password must contain at least one number.")
        }

        // 2. Call registration API
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
        })
        const regData = await regRes.json()
        if (!regRes.ok) {
          throw new Error(regData.error || "Failed to register account")
        }
      }

      // 3. Log in
      const signInResult = await signIn("credentials", {
        email: authEmail.toLowerCase(),
        password: authPassword,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error("Failed to sign in. Please verify your credentials.")
      }

      // 4. Generate dynamic bot configuration prompt
      const niche = answers[0] || "custom business"
      const detailsType = answers[2] || "email"
      const botSystemPrompt = `You are Pixi, a friendly, ultra-intelligent conversational AI assistant built for a ${niche} business. 
Your core business purpose is to solve: "${selectedProblem?.text}".
Tone: Conversational, alive, energetic, and helpful.
Qualification Rule: Direct the conversation smoothly to collect visitors' contact information (specifically: Name, Phone, and Requirement). 
Once you have successfully collected details (e.g. ${detailsType}), tell them: "Got it! I have safely captured your request and our team will get back to you in under 2 hours!"
Do not ask all questions in one large block; ask them conversational, short, and progressive questions one-by-one.`

      // 5. Create bot configuration on backend
      const createBotRes = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${authName || "My"} Pixi`,
          role: selectedProblem?.text || "Assistant",
          systemPrompt: botSystemPrompt,
          url: ""
        })
      })
      const botData = await createBotRes.json()
      if (!createBotRes.ok) {
        throw new Error(botData.error || "Failed to provision your custom Pixi bot")
      }

      const botId = botData.botId
      setCreatedBotId(botId)

      // 6. Handle plan choice
      if (selectedPlan === "premium") {
        // Trigger Razorpay payment
        setProcessingPayment(true)
        const payRes = await fetch("/api/checkout/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botId })
        })
        const { order } = await payRes.json()

        if (!order) throw new Error("Could not initialize payment order")

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "HeyPixi Activation",
          description: "One-time setup fee to activate Pixi on your site",
          order_id: order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch("/api/checkout/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  botId
                })
              })
              const verifyData = await verifyRes.json()
              if (verifyData.success) {
                toast.success("Pixi Activated Successfully! 🚀")
                setCheckoutComplete(true)
                // Redirect to dashboard bot config
                setTimeout(() => {
                  window.location.href = `/dashboard/bots/${botId}`
                }, 2000)
              } else {
                toast.error("Payment verification failed. Please contact support.")
              }
            } catch (err) {
              console.error(err)
              toast.error("Error verifying payment")
            } finally {
              setProcessingPayment(false)
            }
          },
          theme: { color: "#3B82F6" }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        // Free tier bot: redirect directly to dashboard
        toast.success("Account created and bot saved! Redirecting...")
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1500)
      }

    } catch (err: any) {
      console.error(err)
      setAuthError(err.message || "An error occurred. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  // Render content based on current Step state
  return (
    <section id="onboard" className="py-24 md:py-32 relative overflow-hidden flex items-center justify-center min-h-[85vh] scroll-mt-24">
      {/* Script tag to load Razorpay checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Glow decorative blobs */}
      <div className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full bg-brand/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-96 h-96 rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-5xl z-10">
        
        {/* Step Indicator Header */}
        <div className="flex justify-center items-center gap-2 mb-12">
          {[
            { step: 1, label: "Problem" },
            { step: 2, label: "Impact" },
            { step: 3, label: "Solution" },
            { step: 4, label: "Demo" },
            { step: 5, label: "Launch" },
          ].map((s, index) => {
            const isActive = step === s.step
            const isCompleted = step > s.step

            return (
              <div key={s.step} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono transition-all duration-300 ${
                      isActive 
                        ? "bg-brand text-white shadow-lg shadow-brand/35 ring-4 ring-brand/20 scale-110" 
                        : isCompleted 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-100 border border-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check size={16} /> : index + 1}
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider hidden sm:block ${
                    isActive ? "text-brand font-bold" : isCompleted ? "text-emerald-600 font-bold" : "text-slate-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`h-1 w-8 md:w-10 mx-1 md:mx-2 rounded transition-all duration-500 mt-[-18px] ${
                    isCompleted ? "bg-emerald-500" : "bg-slate-200"
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: CHOOSE PROBLEM */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-3xl mx-auto relative"
            >
              <FloatingParticles count={8} />
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <PixiMascot size="lg" mood="happy" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center justify-center bg-brand-light text-brand px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
              >
                <Flame size={12} className="mr-1.5" /> Start Your Magic Onboarding
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Let&apos;s Build Your <span className="text-gradient">Custom Bot</span>
              </h1>
              <p className="text-slate-600 text-lg md:text-xl max-w-xl mx-auto mb-12">
                What is the biggest operational challenge or friction point in your business right now?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl mx-auto">
                {PROBLEMS.map((prob, i) => (
                  <motion.div
                    key={prob.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 150 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <button
                      onClick={() => handleProblemSelect(prob)}
                      className="group relative flex flex-col items-center justify-center p-8 w-full bg-white border border-slate-200 rounded-2xl text-slate-900 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-200 hover:border-brand/40 overflow-hidden cursor-pointer"
                    >
                      <motion.div 
                        className="text-4xl mb-4"
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                      >
                        {prob.emoji}
                      </motion.div>
                      <span className="font-bold text-sm tracking-tight text-slate-800 uppercase font-mono max-w-[200px] text-center">
                        {prob.text}
                      </span>
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 from-brand to-brand-accent" />
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent pointer-events-none"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: PIXI RESPONDS */}
          {step === 2 && selectedProblem && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="max-w-2xl mx-auto"
            >
              <FloatingParticles count={4} />
              <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-200 bg-white">
                
                {/* Pixi Mascot */}
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 mb-8"
                >
                  <PixiMascot size="md" mood={pixiReply ? "happy" : "thinking"} />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-wider font-mono">Pixi Personalizer</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                        {pixiReply ? "Got it! 😊" : "Thinking..."}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Speech bubbles */}
                <div className="space-y-6 mb-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="bg-slate-100 text-slate-800 p-5 rounded-2xl rounded-tl-none border border-slate-200 text-base md:text-lg font-medium leading-relaxed max-w-[90%]"
                  >
                    <TypewriterText text={`Got it. I can fix ${selectedProblem.text} for you in 2 mins. 😺🚀`} speed={20} />
                  </motion.div>

                  {pixiReply ? (
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="bg-brand text-white p-5 rounded-2xl rounded-tl-none text-base md:text-lg font-medium shadow-md shadow-brand/10 max-w-[90%]"
                    >
                      <TypewriterText text={pixiReply} speed={15} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={questionIndex}
                      initial={{ opacity: 0, y: 15, x: -10 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                      className="bg-slate-50 border border-slate-100 text-slate-800 p-5 rounded-2xl rounded-tl-none text-base md:text-lg font-bold max-w-[90%]"
                    >
                      <TypewriterText text={QUESTIONS_BY_PROBLEM[selectedProblem.id].questions[questionIndex]} speed={25} />
                    </motion.div>
                  )}
                </div>

                {/* Option Pill Buttons */}
                {!pixiReply && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {QUESTIONS_BY_PROBLEM[selectedProblem.id].options[questionIndex].map((opt, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 + i * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <button
                          onClick={() => handleAnswerSelect(opt)}
                          className="py-4 px-6 w-full border-2 border-slate-100 bg-slate-50 hover:bg-brand-light hover:border-brand hover:text-brand font-bold text-sm text-slate-800 rounded-xl transition-all flex items-center justify-between group cursor-pointer text-left"
                        >
                          <span>{opt}</span>
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            whileHover={{ opacity: 1, x: 0 }}
                          >
                            <ArrowRight size={14} />
                          </motion.div>
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Progress dot indicator inside card */}
                <div className="flex gap-1.5 justify-end items-center mt-8">
                  {[0, 1, 2].map((idx) => (
                    <motion.div 
                      key={idx}
                      animate={{ 
                        width: idx === questionIndex ? 24 : idx < questionIndex ? 6 : 6,
                        backgroundColor: idx === questionIndex ? "#3B82F6" : idx < questionIndex ? "#10B981" : "#E2E8F0"
                      }}
                      className="h-1.5 rounded-full"
                    />
                  ))}
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 3: OUR SOLUTION */}
          {step === 3 && selectedProblem && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="max-w-3xl mx-auto text-center"
            >
              <FloatingParticles count={10} />
              <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-200 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div 
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <PixiMascot size="lg" mood="happy" />
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4"
                >
                  Here&apos;s Our <span className="text-gradient">Solution</span>
                </motion.h2>

                <div className="max-w-xl mx-auto space-y-6 text-left">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                    className="bg-brand-light/50 rounded-2xl p-6 border border-brand/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{selectedProblem.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Problem</div>
                        <div className="font-bold text-slate-900">{selectedProblem.text}</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedProblem.id === "leads"
                        ? "You're missing out on potential customers who visit your site but leave without sharing their details."
                        : "Your team spends hours answering the same questions daily instead of focusing on high-value work."}
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 150 }}
                    className="bg-slate-50 rounded-2xl p-6 border border-slate-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Impact</div>
                        <div className="font-bold text-slate-900">What this costs you</div>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {selectedProblem.id === "leads" ? (
                        <>
                          <li className="flex items-start gap-2">• Lost revenue from unqualified or missed leads</li>
                          <li className="flex items-start gap-2">• Manual follow-up eats your team&apos;s time</li>
                          <li className="flex items-start gap-2">• No data on who your hottest prospects are</li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2">• Support tickets pile up, response time slows down</li>
                          <li className="flex items-start gap-2">• Your team is burned out from copy-paste answers</li>
                          <li className="flex items-start gap-2">• Customers get frustrated waiting for help</li>
                        </>
                      )}
                    </ul>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 150 }}
                    className="bg-gradient-to-r from-brand/10 to-sky-500/10 rounded-2xl p-6 border border-brand/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <PixiMascot size="sm" mood="idle" />
                      <div>
                        <div className="text-xs font-bold text-brand uppercase tracking-widest font-mono">Pixi Solution</div>
                        <div className="font-bold text-slate-900">How we fix it</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {selectedProblem.id === "leads"
                        ? `A dedicated Pixi Sales Agent that greets your visitors, asks qualifying questions, and captures every lead's Name, Phone & Requirement — then pushes it straight to your CRM or inbox.`
                        : `A Pixi Support Agent trained on your FAQs and docs that answers 80% of repetitive questions instantly — so your team only handles the complex ones.`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs font-bold px-3 py-1.5 bg-white rounded-full border border-brand/20 text-brand">
                        {selectedProblem.id === "leads" ? "🎯 Lead Capture" : "🤖 24/7 Support"}
                      </span>
                      <span className="text-xs font-bold px-3 py-1.5 bg-white rounded-full border border-brand/20 text-brand">
                        {selectedProblem.id === "leads" ? "📥 CRM Sync" : "📚 Auto-Trained"}
                      </span>
                      <span className="text-xs font-bold px-3 py-1.5 bg-white rounded-full border border-brand/20 text-brand">
                        ⚡ No Code
                      </span>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-10"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setStep(4)}
                      className="bg-brand text-white font-extrabold shadow-lg shadow-brand/20 rounded-full px-10 h-14 text-base group"
                    >
                      Try the Demo 
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight size={18} className="ml-2" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: INSTANT DEMO & REVEAL VALUE */}
          {step === 4 && selectedProblem && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                  Meet Your <span className="text-gradient">Custom Pixi</span>!
                </h2>
                <p className="text-slate-500 text-sm md:text-base font-mono uppercase tracking-widest">
                  👉 Chat with your bot in real-time to qualify yourself
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Chatbox Panel (Step 3) */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex flex-col h-[520px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
                    
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <PixiMascot size="sm" />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm font-mono tracking-wide uppercase">My Pixi Agent</h4>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">ON DEMO STAGE</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setChatMessages([])
                          setLeadName("")
                          setLeadPhone("")
                          setLeadReq("")
                          setChatStage(0)
                        }}
                        className="p-2 text-slate-400 hover:text-slate-800 transition-colors hover:bg-slate-100 rounded-lg"
                        title="Reset Chat"
                      >
                        <RefreshCcw size={15} />
                      </button>
                    </div>

                    {/* Chat Messages */}
                    <div 
                      ref={chatContainerRef} 
                      className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40 custom-scrollbar-light"
                    >
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                        >
                          {msg.sender === "bot" && (
                            <div className="w-8 h-8 rounded-lg bg-brand text-white text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <Bot size={14} />
                            </div>
                          )}
                          <div
                            className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                              msg.sender === "user"
                                ? "bg-brand text-white rounded-tr-none shadow-md shadow-brand/10"
                                : "bg-white text-slate-700 border border-slate-200/80 rounded-tl-none shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}

                      {isBotTyping && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand text-white text-xs flex items-center justify-center shrink-0 shadow-sm">
                            <Bot size={14} />
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 flex gap-1 h-9 items-center shadow-sm">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                      <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 text-sm text-slate-800"
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          disabled={!chatInput.trim()} 
                          className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-brand text-white flex items-center justify-center cursor-pointer"
                        >
                          <Send size={15} />
                        </Button>
                      </form>
                    </div>

                  </div>
                </div>

                {/* Lead Card Panel (Step 4) */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="glass-card rounded-2xl p-6 md:p-8 border-2 border-slate-200 bg-white shadow-2xl flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-wider font-mono">Live Value Reveal</h4>
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                          <CheckCircle2 size={12} className="mr-1" /> Dynamic Lead capture
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-8">
                        Below is the structured, real-time qualified lead dashboard. Watch it update as you chat with Pixi on the left!
                      </p>

                      <div className="space-y-4">
                        
                        {/* Name Field */}
                        <div className="relative p-4 bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand/10 text-brand text-xs">
                              <User size={16} />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Visitor Name</span>
                              <span className={`text-sm font-bold tracking-tight block ${leadName ? "text-slate-800" : "text-slate-400 italic"}`}>
                                {leadName || "Waiting for chat entry..."}
                              </span>
                            </div>
                            {leadName && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                                <CheckCircle2 size={18} className="fill-emerald-50 text-emerald-500" />
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* Phone Field */}
                        <div className="relative p-4 bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500 text-xs">
                              <Phone size={16} />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Contact Phone</span>
                              <span className={`text-sm font-bold tracking-tight block ${leadPhone ? "text-slate-800" : "text-slate-400 italic"}`}>
                                {leadPhone || "Waiting for chat entry..."}
                              </span>
                            </div>
                            {leadPhone && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                                <CheckCircle2 size={18} className="fill-emerald-50 text-emerald-500" />
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* Requirement Field */}
                        <div className="relative p-4 bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-500 text-xs">
                              <FileText size={16} />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Requirement</span>
                              <span className={`text-sm font-bold tracking-tight block ${leadReq ? "text-slate-800" : "text-slate-400 italic"}`}>
                                {leadReq || "Waiting for chat entry..."}
                              </span>
                            </div>
                            {leadReq && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                                <CheckCircle2 size={18} className="fill-emerald-50 text-emerald-500" />
                              </motion.div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Ready to get your widget?</span>
                      <Button 
                        onClick={() => setStep(5)} 
                        className="bg-brand text-white font-extrabold shadow-lg shadow-brand/20 hover:scale-102 flex items-center gap-2 rounded-full cursor-pointer px-6"
                      >
                        Next Step <ArrowRight size={16} />
                      </Button>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 5: UNLOCK */}
          {step === 5 && selectedProblem && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="max-w-2xl mx-auto"
            >
              <FloatingParticles count={12} />
              <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-200 bg-white relative overflow-hidden">
                
                {/* Header info */}
                {!selectedPlan ? (
                  <div className="text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      className="flex justify-center mb-6"
                    >
                      <PixiMascot size="lg" mood="happy" />
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Get Pixi on Your Website 😺</h2>
                    <p className="text-slate-600 text-base max-w-md mx-auto mb-10">
                      Your customized bot is ready. One-time payment. Lifetime access.
                    </p>

                    <div className="max-w-sm mx-auto">
                      
                      {/* Premium Option */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                      <button
                        onClick={() => setSelectedPlan("premium")}
                        className="group relative flex flex-col justify-between p-8 bg-white text-slate-900 rounded-2xl text-left shadow-xl border-2 border-brand hover:-translate-y-1 hover:shadow-brand/25 transition-all duration-300 cursor-pointer overflow-hidden w-full"
                      >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
                        <div>
                          <span className="bg-brand text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono">One-Time</span>
                          <h4 className="font-extrabold text-2xl mt-3 tracking-tight">Activate Pixi</h4>
                          <p className="text-slate-500 text-sm leading-relaxed mt-2">
                            Lifetime hosting, unlimited leads, full API config access.
                          </p>
                        </div>
                        <div className="mt-8 flex items-baseline gap-1.5">
                          <span className="text-4xl font-black tracking-tight">₹2,000</span>
                          <span className="text-slate-400 text-xs font-mono">one-time</span>
                        </div>
                        <div className="mt-6 w-full py-3 bg-brand text-white rounded-xl text-center text-sm font-extrabold tracking-wider uppercase group-hover:scale-[1.03] transition-transform shadow-lg shadow-brand/20">
                          🚀 Get Pixi
                        </div>
                      </button>
                      </motion.div>

                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {/* Return link to adjust plans */}
                    <button 
                      onClick={() => {
                        setSelectedPlan(null)
                        setAuthError("")
                      }} 
                      className="text-xs font-bold text-slate-400 hover:text-brand flex items-center gap-1.5 mb-6 uppercase tracking-wider font-mono mx-auto"
                    >
                      ← Switch Plan
                    </button>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="max-w-md mx-auto"
                    >
                      <div className="w-16 h-16 bg-brand-light text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles size={32} />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Get Pixi for ₹2,000
                      </h3>
                      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
                        Create your account and activate your bot with lifetime access.
                      </p>
                      <Button
                        onClick={() => router.push("/auth/signup")}
                        className="bg-brand text-white font-extrabold h-14 px-10 shadow-lg shadow-brand/20 rounded-full text-base"
                      >
                        Create Account & Continue
                        <ArrowRight size={18} className="ml-2" />
                      </Button>
                      <p className="text-xs text-slate-400 mt-4">
                        Already have an account?{" "}
                        <button onClick={() => router.push("/auth/signin")} className="text-brand font-bold hover:underline">
                          Log In
                        </button>
                      </p>
                    </motion.div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  )
}
