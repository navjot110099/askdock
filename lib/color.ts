function rgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or ink text, whichever has more contrast on `hex`. */
export function readableOn(hex: string) {
  const l = luminance(hex);
  return (1.05) / (l + 0.05) >= (l + 0.05) / (0.0074 + 0.05) ? "#ffffff" : "#18131f";
}

export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
