import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { import: importPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          pathGroups: [{ pattern: "@/**", group: "internal", position: "before" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      // Code-style size limits (docs/code-style.md): file <= 300 lines, depth <= 3.
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // React components are allowed up to 100 lines per docs/code-style.md.
    files: ["**/*.tsx"],
    rules: {
      "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Tests, configs and seed scripts are exempt from size limits.
    files: ["tests/**", "prisma/seed.ts", "*.config.*", ".lintstagedrc.json"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "worker/dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".lintstagedrc.json",
    "commitlint.config.mjs",
  ]),
]);

export default eslintConfig;
