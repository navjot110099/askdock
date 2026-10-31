/** Built-in bot avatars: gradient discs with a simple glyph, stored as `preset:<id>`. */
export type AvatarPreset = { id: string; label: string; from: string; to: string; glyph: string };

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "spark",
    label: "Spark",
    from: "#ff9a6c",
    to: "#8f67ee",
    glyph: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z",
  },
  {
    id: "tooth",
    label: "Tooth",
    from: "#3fb5c2",
    to: "#2b6f9b",
    glyph:
      "M8.2 4.2c1.3 0 2.3.6 3.8.6s2.5-.6 3.8-.6c2.4 0 3.9 2 3.6 4.8-.2 1.9-1 3.2-1.5 4.9-.6 2.1-.8 5.6-2.4 5.9-1.5.3-1.6-3.8-3.5-3.8s-2 4.1-3.5 3.8c-1.6-.3-1.8-3.8-2.4-5.9-.5-1.7-1.3-3-1.5-4.9-.3-2.8 1.2-4.8 3.6-4.8z",
  },
  {
    id: "sparkle",
    label: "Sparkle",
    from: "#c084fc",
    to: "#6d4ae0",
    glyph: "M12 2.5l2 6.2 6.5.3-5.1 4 1.8 6.3L12 15.6l-5.2 3.7 1.8-6.3-5.1-4 6.5-.3z",
  },
  {
    id: "leaf",
    label: "Leaf",
    from: "#7fd6a8",
    to: "#2f8f6a",
    glyph: "M19 4.5c-7.8 0-13.5 4-13.5 10.3 0 1.6.5 3 1.3 4.2 1-4.2 3.8-7.3 7.4-9-3 2.3-5 5.3-5.7 9.3 1 .5 2.1.7 3.3.7 5.6 0 8.2-5.7 7.2-15.5z",
  },
  {
    id: "heart",
    label: "Heart",
    from: "#ff8fa8",
    to: "#e04a7a",
    glyph: "M12 20s-7.5-4.6-7.5-10.1C4.5 7 6.6 5 9 5c1.3 0 2.4.6 3 1.6C12.6 5.6 13.7 5 15 5c2.4 0 4.5 2 4.5 4.9C19.5 15.4 12 20 12 20z",
  },
  {
    id: "chat",
    label: "Chat",
    from: "#ffb36c",
    to: "#ee5f92",
    glyph: "M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5h-7.2L8 20v-3.5H5A1.5 1.5 0 013.5 15V7A1.5 1.5 0 015 5.5z",
  },
];

export function getAvatarPreset(avatar: string) {
  if (!avatar.startsWith("preset:")) return null;
  const id = avatar.slice("preset:".length);
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}

export const BRAND_COLORS = ["#23798a", "#8f67ee", "#ee5f92", "#ff8a4c", "#2f8f6a", "#2563eb", "#18131f", "#b4533c"];
