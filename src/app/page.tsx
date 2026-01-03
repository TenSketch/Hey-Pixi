
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { ChatbotTypes } from "@/components/sections/ChatbotTypes";
import { Pricing } from "@/components/sections/Pricing";
import { BuildDemo } from "@/components/sections/BuildDemo";
import { Footer } from "@/components/layout/Footer";
import { ParallaxBackground } from "@/components/ui/ParallaxBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-brand-light selection:text-brand-dark">
      <Navbar />
      <ParallaxBackground />
      <Hero />
      <LiveDemo />
      <ChatbotTypes />
      <Pricing />
      <BuildDemo />
      <Footer />
    </main>
  );
}
