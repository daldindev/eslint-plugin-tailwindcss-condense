import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      ".agent/**",
      ".npm-cache/**",
      "eslint-plugin-tailwindcss-condense/**",
      "node_modules/**",
    ],
  },
  {
    files: ["src/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: "module",
    },
  },
]);
