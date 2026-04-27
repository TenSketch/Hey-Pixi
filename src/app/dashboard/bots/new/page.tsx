"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Bot, Globe, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBot } from "@/lib/actions/bot-actions";

export default function CreateBotPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole] = useState("support");
  const [url, setUrl] = useState("");
  const [botName, setBotName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("");

  const handleNext = async () => {
    if (currentStep === 0) {
      // Step 1 -> 2: Analyze URL
      setIsAnalyzing(true);
      setLoadingStatus("Connecting...");
      let success = false;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, role: selectedRole, botName: botName || "AI Assistant" }),
        });
        
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");
        
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.error) {
                                toast.error(data.error);
                                throw new Error(data.error);
                            }
                            if (data.status) {
                                setLoadingStatus(data.status);
                            }
                            if (data.success) {
                                setGeneratedPrompt(data.prompt);
                                success = true;
                            }
                        } catch {
                            // ignore incomplete JSON
                        }
                    }
                }
            }
        }
      } catch (err) {
        console.error("Failed to analyze", err);
      } finally {
        setIsAnalyzing(false);
        setLoadingStatus("");
        if (success) setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      // Final Step: Save via Server Action
      setIsAnalyzing(true);
      setLoadingStatus("Saving agent...");
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
         setLoadingStatus("");
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
                
                {/* Step 1: Data */}
                {currentStep === 0 && (
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

                {/* Step 2: Review Prompts */}
                {currentStep === 1 && (
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
                    <p className="text-slate-400 text-sm font-bold uppercase hidden sm:block tracking-wider">Step {currentStep + 1} of 2</p>
                    <Button 
                        onClick={handleNext}
                        disabled={(currentStep === 0 && !url) || isAnalyzing}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {loadingStatus || "Working..."}</>
                        ) : currentStep === 1 ? (
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
