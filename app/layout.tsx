import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AskDock — AI chatbots for small businesses, trained on your own content",
    template: "%s · AskDock",
  },
  description:
    "Turn your PDFs, docs and website into a friendly AI assistant that answers customers 24/7 with cited sources, captures leads when it can't, and installs with one line of code.",
  applicationName: "AskDock",
  keywords: ["AI chatbot", "customer support chatbot", "website chatbot", "RAG", "small business", "lead capture"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "AskDock",
    locale: "en_US",
    title: "AskDock — Your website's best front-desk hire",
    description: "AI chatbots trained on your own documents and website. Cited answers, lead capture, one-line install.",
  },
  twitter: { card: "summary_large_image", title: "AskDock", description: "AI chatbots trained on your own content." },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#fbf8f4" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body className="antialiased">
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
