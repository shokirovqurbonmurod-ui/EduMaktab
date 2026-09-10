import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Uzbek text legitimately contains apostrophes in JSX text
      // (o'qituvchi, ko'rsat, o'qish …). Escaping every one with &apos;
      // would hurt readability; the HTML-safety intent of the rule is
      // covered by the JSX parser itself.
      "react/no-unescaped-entities": "off",
      // React Compiler lint rules are overly strict for this codebase:
      // "purity" flags stable helpers (todayISO, Date.now) even inside
      // event handlers, "preserve-manual-memoization" flags memos whose
      // deps are stable derived primitives, "set-state-in-effect" flags
      // one-shot hydration resets, and "use-memo"/"immutability" flag the
      // intentional usePageData hook API (dynamic deps array, hoisted
      // load callback). Keep them visible as warnings without failing lint.
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
