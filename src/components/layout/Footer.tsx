
import { Bot, Github, Twitter } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="relative bg-black text-white border-t border-white/10 pt-20 pb-10 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
             <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-brand to-brand-accent p-1.5 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight">HeyPixi</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              The AI sales agent that qualifies leads, books meetings, and closes deals while you sleep.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-6 text-lg">Product</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-brand transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Showcase</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Integrations</Link></li>
            </ul>
          </div>

           <div>
            <h3 className="font-bold mb-6 text-lg">Company</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-brand transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Contact</Link></li>
            </ul>
          </div>

           <div>
            <h3 className="font-bold mb-6 text-lg">Connect</h3>
            <div className="flex gap-4">
              <Link href="#" className="bg-white/5 p-3 rounded-full hover:bg-brand hover:text-white transition-all"><Twitter className="w-5 h-5"/></Link>
              <Link href="#" className="bg-white/5 p-3 rounded-full hover:bg-brand hover:text-white transition-all"><Github className="w-5 h-5"/></Link>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div>© {currentYear} TenSketch. All rights reserved.</div>
          <div className="flex gap-6">
              <Link href="#" className="hover:text-white">Privacy Policy</Link>
              <Link href="#" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
