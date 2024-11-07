import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier";


/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: [
    "**/api/",
    "**/build/",
    "**/config/",
    "**/node_modules/",
    "**/script/",
    "**/coverage/",
    "**/dist/",
    "**/test-results/",
    "**/playwright-report/",
    "**/public/",
    "**/resources/"
  ]},
  { files: [
    "**/*.{js,mjs,cjs,ts,jsx,tsx}"
  ]},
  { languageOptions: 
    { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,
  {settings: {
    react: {
        version: "detect",
    },
  }},
  {
    files: ["preload.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];