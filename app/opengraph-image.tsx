import { ImageResponse } from "next/og";

export const alt = "AskDock — AI chatbots for small businesses, trained on your own content";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#fbf8f4",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(255,154,108,0.55), rgba(255,154,108,0) 55%), radial-gradient(circle at 100% 0%, rgba(143,103,238,0.5), rgba(143,103,238,0) 55%), radial-gradient(circle at 70% 100%, rgba(63,181,194,0.35), rgba(63,181,194,0) 50%)",
          color: "#18131f",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontFamily: "sans-serif", fontWeight: 600 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#18131f", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 40, height: 28, borderRadius: 8, background: "linear-gradient(115deg,#ff9a6c,#ee5f92,#8f67ee,#3fb5c2)" }} />
          </div>
          AskDock
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 1.02, letterSpacing: -2 }}>
          <span>Turn your website into a</span>
          <span style={{ fontStyle: "italic", color: "#8f67ee" }}>front desk that never sleeps.</span>
        </div>
        <div style={{ fontSize: 30, fontFamily: "sans-serif", color: "#6c6576" }}>Cited answers · Lead capture · One-line install</div>
      </div>
    ),
    size,
  );
}
