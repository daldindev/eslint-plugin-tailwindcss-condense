import type { ESLint, Linter } from "eslint";

export interface TailwindcssCondensePluginOptions {
  autoDiscoverThemeFiles?: boolean;
  callees?: string[];
  cwd?: string;
  themeFiles?: string[];
}

export interface TailwindcssCondensePlugin extends ESLint.Plugin {
  configs: {
    "flat/recommended": Linter.Config[];
  };
}

declare const plugin: TailwindcssCondensePlugin;

export default plugin;
