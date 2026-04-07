"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Bot, Globe, CheckCircle2, ChevronRight, Wand2, ShoppingCart, Headset, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createBot } from "@/lib/actions/bot-actions";

const ROLES = [
  { id: 'sales', title: 'Sales Agent', icon: ShoppingCart, desc: 'Recommend products & close deals.' },
  { id: 'support', title: 'Customer Support', icon: Headset, desc: 'Solve tickets 24/7 instantly.' },
  { id: 'lead', title: 'Lead Qualifier', icon: BarChart3, desc: 'Score and book meetings.' },
  { id: 'custom', title: 'Custom Bot', icon: Wand2, desc: 'Build for any specific niche.' },
];

export default function CreateBotPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [url, setUrl] = useState("");
  const [botName, setBotName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleNext = async () => {
    if (currentStep === 1) {
      // Step 2 -> 3: Analyze URL
      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, role: selectedRole, botName: botName || "AI Assistant" }),
        });
        const data = await res.json();
        if (data.prompt) setGeneratedPrompt(data.prompt);
      } catch (err) {
        console.error("Failed to analyze", err);
      } finally {
        setIsAnalyzing(false);
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Final Step: Save via Server Action
      setIsAnalyzing(true);
      try {
        const result = await createBot({
            name: botName || "My Assistant",
            role: selectedRole,
            url,
            systemPrompt: generatedPrompt,
        });
        
        if (result.success && result.botId) {
             toast.success("Agent created successfully!");
             router.push(`/dashboard`);
             router.refresh();
        } else {
             toast.error(result.error || "Failed to create bot");
        }
      } catch (err) {
         console.error(err);
      } finally {
         setIsAnalyzing(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Create New Agent</h2>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex-1 p-8 md:p-12">
                
                {/* Step 1: Role */}
                {currentStep === 0 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Select Agent Role</h3>
                        <p className="text-slate-500 mb-8">What is the primary objective of this AI?</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={cn(
                                        "p-6 border-2 text-left rounded-xl transition-all",
                                        selectedRole === role.id ? "border-brand bg-brand-light/30" : "border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                                        selectedRole === role.id ? "bg-brand text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <role.icon size={24} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">{role.title}</h4>
                                    <p className="text-sm text-slate-500">{role.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Data */}
                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col justify-center">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">Train Your Agent</h3>
                        <p className="text-slate-500 mb-8 text-center">Provide a website URL for the AI to learn your business.</p>
                        
                        <div className="max-w-md mx-auto w-full space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Agent Name</label>
                                <input 
                                    type="text" 
                                    value={botName}
                                    onChange={(e) => setBotName(e.target.value)}
                                    placeholder="e.g. Sales Pixi" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Website Source URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="text-slate-400" size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://your-domain.com" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Review Prompts */}
                {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                         <h3 className="text-[28px] font-extrabold text-slate-900 mb-2">Review Instructions</h3>
                         <p className="text-slate-500 mb-8 font-medium">Here is the auto-generated system prompt based on your website.</p>

                         <div className="flex-1 bg-slate-50 rounded-2xl p-6 overflow-hidden flex flex-col shadow-sm border border-slate-200 min-h-[350px] md:min-h-[450px]">
                              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
                                  <div className="flex items-center gap-2 text-brand font-mono text-xs font-bold tracking-widest uppercase">
                                      <Bot size={16} /> SYSTEM_PROMPT.CFG
                                  </div>
                                  <div className="flex gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                  </div>
                              </div>
                              <textarea
                                value={generatedPrompt}
                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                className="w-full flex-1 bg-transparent text-slate-800 text-sm font-mono focus:outline-none resize-none leading-relaxed tracking-wide custom-scrollbar-light"
                                spellCheck="false"
                              />
                         </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white p-6 border-t border-slate-100 flex justify-between items-center px-8 md:px-12">
                <Button 
                    variant="ghost" 
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 0 || isAnalyzing}
                    className="text-slate-400 hover:text-slate-600 font-semibold px-0 hover:bg-transparent"
                >
                    Back
                </Button>
                <div className="flex items-center gap-6">
                    <p className="text-slate-400 text-sm font-bold uppercase hidden sm:block tracking-wider">Step {currentStep + 1} of 3</p>
                    <Button 
                        onClick={handleNext}
                        disabled={(currentStep === 0 && !selectedRole) || (currentStep === 1 && !url) || isAnalyzing}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Working...</>
                        ) : currentStep === 2 ? (
                            <><CheckCircle2 className="w-5 h-5 mr-2" /> Finish & Save</>
                        ) : (
                            <>Next Step <ChevronRight className="w-5 h-5 ml-1" /></>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}
