
import { Navbar } from "@/components/layout/Navbar";
import { GamifiedFlow } from "@/components/sections/GamifiedFlow";
import { Footer } from "@/components/layout/Footer";
import { ParallaxBackground } from "@/components/ui/ParallaxBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-brand-light selection:text-brand-dark">
      <Navbar />
      <ParallaxBackground />
      <GamifiedFlow />
      <Footer />
    </main>
  );
}
