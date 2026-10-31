import { Hero } from "@/components/marketing/hero";
import { LiveDemo } from "@/components/marketing/live-demo";
import { Faq, Features, FinalCta, HowItWorks, Industries, Pricing } from "@/components/marketing/sections";
import { toChatConfig } from "@/lib/chat-config";
import { repo } from "@/lib/db";
import { DEMO_BOT_ID } from "@/lib/demo/constants";
import { env, hasOpenAI } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const bot = await repo.getPublicBot(env.demoBotId || DEMO_BOT_ID).catch(() => null);
  const demoBot = bot ? toChatConfig(bot) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AskDock",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "AI chatbot builder for small businesses: trained on your documents and website, with cited answers and lead capture.",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Pro", price: "29", priceCurrency: "USD" },
      { "@type": "Offer", name: "Business", price: "99", priceCurrency: "USD" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <Industries />
      <HowItWorks />
      <Features />
      <LiveDemo bot={demoBot} offline={!hasOpenAI} />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
