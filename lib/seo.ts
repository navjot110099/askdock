import type { Metadata } from "next";
import { alt, size } from "@/app/opengraph-image";

/**
 * Complete metadata for an indexable page. Next.js replaces (not merges) a
 * parent's `openGraph` / `twitter` objects — including the image from
 * app/opengraph-image.tsx — so each public page sets them in full.
 */
export function pageMetadata({ title, description, path }: { title?: string; description: string; path: string }): Metadata {
  const fullTitle = title ? `${title} · AskDock` : "AskDock — AI chatbots for small businesses, trained on your own content";
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "AskDock",
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [{ url: "/opengraph-image", ...size, alt }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [{ url: "/twitter-image", alt }] },
  };
}
