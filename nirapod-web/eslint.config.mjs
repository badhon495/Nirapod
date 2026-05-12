import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nirapodRules = require("./eslint-rules/index.js");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { nirapod: nirapodRules },
    rules: {
      "nirapod/no-gradient": "error",
      "nirapod/no-transition-all": "error",
      "nirapod/no-inline-style-layout": "warn",
    },
  },
]);

export default eslintConfig;
