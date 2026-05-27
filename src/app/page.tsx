import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { ChatbotTypes } from "@/components/sections/ChatbotTypes";
import { Pricing } from "@/components/sections/Pricing";
import { GamifiedFlow } from "@/components/sections/GamifiedFlow";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-brand-light selection:text-brand-dark">
      <Navbar />
      <Hero />
      <LiveDemo />
      <ChatbotTypes />
      <Pricing />
      <GamifiedFlow />
      <Footer />
    </main>
  );
}
