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
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  // ── Frontières du monolithe modulaire (cf. src/modules/README.md) ──────────
  // Un split physique futur doit rester un changement de déploiement : on
  // interdit donc tout import croisé entre verticales, et toute dépendance du
  // cœur vers une verticale. Le partage passe TOUJOURS par `core`.
  {
    files: ["src/modules/stay/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/immo", "@/modules/immo/**"],
              message:
                "Frontière de module : `stay` ne doit pas importer `immo`. Passez par `core`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/immo/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/stay", "@/modules/stay/**"],
              message:
                "Frontière de module : `immo` ne doit pas importer `stay`. Passez par `core`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/stay",
                "@/modules/stay/**",
                "@/modules/immo",
                "@/modules/immo/**",
              ],
              message:
                "`core` ne doit dépendre d'aucune verticale (stay/immo).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
