import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // App code logs through lib/logger.ts (debug/info are silent in production).
  { rules: { "no-console": "error" } },
  // CLI scripts print progress for whoever runs them; the logger wraps console itself.
  { files: ["lib/logger.ts", "scripts/**", "portfolio/source/**"], rules: { "no-console": "off" } },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
