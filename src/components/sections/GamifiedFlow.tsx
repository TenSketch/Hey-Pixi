"use client"

import { useState, useRef, useEffect } from "react"
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
  EyeOff
} from "lucide-react"

// Razorpay script loaded dynamically in render block

// Problem sets for Step 1
const PROBLEMS = [
  { id: "leads", emoji: "😤", text: "Not getting leads", color: "from-rose-500 to-orange-500" },
  { id: "repeated", emoji: "📞", text: "Too many repeated questions", color: "from-amber-500 to-yellow-500" },
  { id: "data", emoji: "📊", text: "Don’t understand my data", color: "from-teal-500 to-emerald-500" },
  { id: "converting", emoji: "🛍️", text: "Not converting visitors", color: "from-violet-500 to-fuchsia-500" },
  { id: "automation", emoji: "🧾", text: "Need automation", color: "from-blue-500 to-indigo-500" },
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
  "data": {
    questions: [
      "What analytics tool do you currently use (or try to use)? 📊",
      "Which metric keeps you up at night? 🌙",
      "How would you prefer Pixi to present reports to you? 📬"
    ],
    options: [
      ["Google Analytics", "Mixpanel / Amplitude", "Just Stripe/Shopify dash", "Honestly, nothing yet!"],
      ["Bounce rate / Drop-offs", "Abandoned checkouts", "Cost per acquisition", "Where leads get lost"],
      ["Daily Slack summary", "A weekly email report", "Interactive web dashboard"]
    ],
    replies: [
      "Ah, GA can be a complete maze to navigate.",
      "Totally. Let's pinpoint exactly why that happens.",
      "Got it! Visual, clean, and direct reporting is key."
    ]
  },
  "converting": {
    questions: [
      "What's the main reason visitors leave without buying/converting? 🛍️",
      "Do you offer any incentive to hesitant buyers right now? 🎁",
      "If Pixi could offer a custom discount to a user about to bounce, would that help? 💡"
    ],
    options: [
      ["Confused by options", "Unsure about trust/price", "Just window shopping", "High checkout friction"],
      ["None, we sell at retail", "A standard 10% discount", "Free shipping above limit", "Free consultation call"],
      ["Yes, absolutely! 🚀", "Maybe, depending on items", "No, we prefer other methods"]
    ],
    replies: [
      "Friction or product confusion kills sales.",
      "An incentive is a great hook, let's make it smarter.",
      "Exactly! Exit-intent conversational popups work like magic."
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

  // Initialize chatbot messages when Step 3 is reached
  useEffect(() => {
    if (step === 3 && chatMessages.length === 0) {
      setIsBotTyping(true)
      const timer = setTimeout(() => {
        let greeting = "Hi there! I'm your newly configured Pixi. 👋 "
        if (selectedProblem?.id === "leads") {
          greeting += "I'm primed and ready to capture high-value leads on your website! Shall we see how I qualify your visitors?"
        } else if (selectedProblem?.id === "repeated") {
          greeting += "I'm trained on your documents and ready to answering support questions 24/7. Want to see a quick test?"
        } else if (selectedProblem?.id === "data") {
          greeting += "I'm loaded with analytics capabilities and ready to summarize visitor insights. Let's see how I collect lead feedback!"
        } else if (selectedProblem?.id === "converting") {
          greeting += "I'm set up with exit-intent intelligence to offer personalized discounts and save bouncing carts. Try chatting with me!"
        } else {
          greeting += "I'm automated and ready to push qualified leads directly to your sheets and CRM. Let's test the capture flow!"
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
    <section className="py-24 md:py-32 relative overflow-hidden flex items-center justify-center min-h-[85vh]">
      {/* Script tag to load Razorpay checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Glow decorative blobs */}
      <div className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full bg-brand/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-96 h-96 rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-5xl z-10">
        
        {/* Step Indicator Header */}
        <div className="flex justify-center items-center gap-2 mb-12">
          {[1, 2, 3, 5].map((s, index) => {
            const displayStep = index + 1 // 1, 2, 3, 4
            let isActive = false
            let isCompleted = false
            if (s === 5) {
              isActive = step === 5
              isCompleted = false
            } else if (s === 3) {
              isActive = step === 3
              isCompleted = step > 3
            } else {
              isActive = step === s
              isCompleted = step > s
            }

            return (
              <div key={s} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono transition-all duration-300 ${
                    isActive 
                      ? "bg-brand text-white shadow-lg shadow-brand/35 ring-4 ring-brand/20 scale-110" 
                      : isCompleted 
                        ? "bg-emerald-500 text-white" 
                        : "bg-slate-100 border border-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : displayStep}
                </div>
                {index < 3 && (
                  <div className={`h-1 w-10 md:w-16 mx-1 md:mx-2 rounded transition-all duration-500 ${
                    step > s ? "bg-emerald-500" : "bg-slate-200"
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
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center justify-center bg-brand-light text-brand px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Flame size={12} className="mr-1.5" /> Start Your Magic Onboarding
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Let&apos;s Build Your <span className="text-gradient">Custom Bot</span>
              </h1>
              <p className="text-slate-600 text-lg md:text-xl max-w-xl mx-auto mb-12">
                What is the biggest operational challenge or friction point in your business right now?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
                {PROBLEMS.map((prob) => (
                  <button
                    key={prob.id}
                    onClick={() => handleProblemSelect(prob)}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl text-slate-900 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-200 hover:border-brand/40 overflow-hidden cursor-pointer"
                  >
                    <div className="text-4xl mb-4 transform transition-transform duration-300 group-hover:scale-120 group-hover:rotate-6">
                      {prob.emoji}
                    </div>
                    <span className="font-bold text-sm tracking-tight text-slate-800 uppercase font-mono max-w-[200px] text-center">
                      {prob.text}
                    </span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 from-brand to-brand-accent" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: PIXI RESPONDS */}
          {step === 2 && selectedProblem && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-200 bg-white">
                
                {/* Robot Icon mascot */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20">
                    <Bot size={28} className="animate-float" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-wider font-mono">Pixi Personalizer</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Adapting Tone...</span>
                    </div>
                  </div>
                </div>

                {/* Speech bubbles */}
                <div className="space-y-6 mb-8">
                  <div className="bg-slate-100 text-slate-800 p-5 rounded-2xl rounded-tl-none border border-slate-200 text-base md:text-lg font-medium leading-relaxed max-w-[90%]">
                    Got it. I can fix <span className="font-extrabold text-brand uppercase">{selectedProblem.text}</span> for you in 2 mins. 😺🚀
                  </div>

                  {pixiReply ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-brand text-white p-5 rounded-2xl rounded-tl-none text-base md:text-lg font-medium shadow-md shadow-brand/10 max-w-[90%]"
                    >
                      {pixiReply}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 border border-slate-100 text-slate-800 p-5 rounded-2xl rounded-tl-none text-base md:text-lg font-bold max-w-[90%]"
                    >
                      {QUESTIONS_BY_PROBLEM[selectedProblem.id].questions[questionIndex]}
                    </motion.div>
                  )}
                </div>

                {/* Option Pill Buttons */}
                {!pixiReply && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {QUESTIONS_BY_PROBLEM[selectedProblem.id].options[questionIndex].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(opt)}
                        className="py-4 px-6 border-2 border-slate-100 bg-slate-50 hover:bg-brand-light hover:border-brand hover:text-brand font-bold text-sm text-slate-800 rounded-xl transition-all hover:scale-102 flex items-center justify-between group cursor-pointer text-left"
                      >
                        <span>{opt}</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 duration-200" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Progress dot indicator inside card */}
                <div className="flex gap-1.5 justify-end items-center mt-8">
                  {[0, 1, 2].map((idx) => (
                    <div 
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === questionIndex ? "w-6 bg-brand" : idx < questionIndex ? "w-1.5 bg-emerald-500" : "w-1.5 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 3 & 4: INSTANT DEMO & REVEAL VALUE */}
          {step === 3 && selectedProblem && (
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
                        <div className="w-10 h-10 bg-brand text-white flex items-center justify-center rounded-xl shadow-md shadow-brand/10">
                          <Bot size={20} />
                        </div>
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-200 bg-white">
                
                {/* Header info */}
                {!selectedPlan ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-brand-light text-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-brand/5">
                      <Sparkles size={32} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Want Pixi on your website? 😺</h2>
                    <p className="text-slate-600 text-base max-w-md mx-auto mb-10">
                      Your customized bot is generated. Choose your hosting option below to claim your Pixi!
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch max-w-lg mx-auto">
                      
                      {/* Premium Option */}
                      <button
                        onClick={() => setSelectedPlan("premium")}
                        className="group relative flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 to-black text-white rounded-2xl text-left shadow-xl hover:-translate-y-1 hover:shadow-brand/25 transition-all border border-slate-800 duration-300 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/20 rounded-full blur-2xl pointer-events-none" />
                        <div>
                          <span className="bg-brand text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono">Premium</span>
                          <h4 className="font-extrabold text-xl mt-3 tracking-tight">Activate Pixi</h4>
                          <p className="text-slate-400 text-xs leading-relaxed mt-2">
                            One-time payment for lifetime hosting, unlimited leads, and full API config access.
                          </p>
                        </div>
                        <div className="mt-8 flex items-baseline gap-1.5">
                          <span className="text-3xl font-black tracking-tight">₹999</span>
                          <span className="text-slate-400 text-xs font-mono">one-time</span>
                        </div>
                        <div className="mt-6 w-full py-2.5 bg-brand text-white rounded-xl text-center text-xs font-extrabold tracking-wider uppercase group-hover:scale-[1.03] transition-transform">
                          🚀 Go Premium
                        </div>
                      </button>

                      {/* Trial Option */}
                      <button
                        onClick={() => setSelectedPlan("free")}
                        className="group flex flex-col justify-between p-6 bg-white text-slate-900 rounded-2xl text-left border border-slate-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div>
                          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-mono">Free</span>
                          <h4 className="font-extrabold text-xl mt-3 tracking-tight">Try More First</h4>
                          <p className="text-slate-500 text-xs leading-relaxed mt-2">
                            14-day free access to test bot qualifications with a limit of 50 conversations.
                          </p>
                        </div>
                        <div className="mt-8 flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-800 tracking-tight">₹0</span>
                          <span className="text-slate-400 text-xs font-mono">/ 14 days</span>
                        </div>
                        <div className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl text-center text-xs font-extrabold tracking-wider uppercase group-hover:bg-brand transition-colors">
                          🎁 Try Free
                        </div>
                      </button>

                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Return link to adjust plans */}
                    <button 
                      onClick={() => {
                        setSelectedPlan(null)
                        setAuthError("")
                      }} 
                      className="text-xs font-bold text-slate-400 hover:text-brand flex items-center gap-1.5 mb-6 uppercase tracking-wider font-mono"
                    >
                      ← Switch Plan
                    </button>

                    {/* Confetti or payment verification block */}
                    {checkoutComplete ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 size={36} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Verified!</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mt-2 max-w-sm mx-auto">
                          Congratulations! Your Pixi has been activated and saved. We are preparing your admin dashboard workspace...
                        </p>
                        <Loader2 className="animate-spin text-brand w-6 h-6 mx-auto mt-8" />
                      </div>
                    ) : (
                      <div>
                        {/* Auth Form (Inline signup/signin) */}
                        <div className="text-center mb-8">
                          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            {isAuthMode === "signup" ? "Claim Your Custom Pixi" : "Log In to Claim Pixi"}
                          </h3>
                          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                            {isAuthMode === "signup" 
                              ? `Create your account to secure your bot under the ${selectedPlan === "premium" ? "Premium (₹999)" : "14-day Free"} plan.` 
                              : "Enter your account credentials to bind your brand new bot configuration."
                            }
                          </p>
                        </div>

                        {authError && (
                          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl text-center leading-relaxed">
                            {authError}
                          </div>
                        )}

                        <form onSubmit={handleAuthSubmit} className="space-y-4 max-w-md mx-auto">
                          {isAuthMode === "signup" && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Full Name</label>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                  type="text"
                                  required
                                  value={authName}
                                  onChange={(e) => setAuthName(e.target.value)}
                                  placeholder="John Doe"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 text-slate-800"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input
                                type="email"
                                required
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 text-slate-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder={isAuthMode === "signup" ? "Min. 8 chars, 1 number" : "••••••••"}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            disabled={authLoading || processingPayment}
                            className="w-full bg-brand text-white font-extrabold h-12 shadow-lg shadow-brand/20 mt-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {authLoading || processingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {processingPayment ? "Launching Payment..." : "Provisioning Account..."}
                              </>
                            ) : (
                              <>
                                {isAuthMode === "signup" ? "Create Account & Claim Pixi" : "Log In & Claim Pixi"}
                                <ArrowRight size={16} />
                              </>
                            )}
                          </Button>
                        </form>

                        <div className="mt-8 text-center text-sm font-semibold text-slate-500 font-mono">
                          {isAuthMode === "signup" ? (
                            <span>
                              Already have an account?{" "}
                              <button 
                                onClick={() => {
                                  setIsAuthMode("signin")
                                  setAuthError("")
                                  setShowPassword(false)
                                }} 
                                className="text-brand font-bold hover:underline"
                              >
                                Log In
                              </button>
                            </span>
                          ) : (
                            <span>
                              Don&apos;t have an account?{" "}
                              <button 
                                onClick={() => {
                                  setIsAuthMode("signup")
                                  setAuthError("")
                                  setShowPassword(false)
                                }} 
                                className="text-brand font-bold hover:underline"
                              >
                                Sign Up
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

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
