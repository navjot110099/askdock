import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "unpdf"],
  async headers() {
    return [
      {
        // The chat iframe must be embeddable on any customer website.
        source: "/embed/:path*",
        headers: [...securityHeaders, { key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
      {
        source: "/((?!embed/).*)",
        headers: [...securityHeaders, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        source: "/widget.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
