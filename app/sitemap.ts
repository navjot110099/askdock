import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const base = siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/widget-demo`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
