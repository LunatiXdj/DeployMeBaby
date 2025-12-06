import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es6,
      },
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.warnings.rules,
      ...importPlugin.configs.typescript.rules,
      "quotes": ["error", "double"],
      "import/no-unresolved": 0,
      "indent": ["error", 2],
    },
    ignores: ["**/lib/**", "src/dataconnect-generated/**", "src/genkit-sample.js", "src/index.js", "eslint.config.js"],
  },
];