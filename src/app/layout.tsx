import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hey Pixi | Talk to AI Before You Buy It",
  description: "Play with interactive AI chatbots. See types, choose one, try with your own business data. No signup required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        <AuthProvider>
          {children}
          <Toaster 
            position="top-center" 
            richColors 
            expand={false}
            toastOptions={{
              style: {
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
              },
              className: 'font-sans',
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
