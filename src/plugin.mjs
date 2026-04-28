import { createRequire } from "node:module";

import createGroupRelatedClassesRule from "./rules/group-related-classes.mjs";
import createNormalizeClassSpacingRule from "./rules/normalize-class-spacing.mjs";
import createPreferClassShorthandRule from "./rules/prefer-class-shorthand.mjs";
import createSortClassVariantsRule from "./rules/sort-class-variants.mjs";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const pluginId = "tailwindcss-condense";

function createRules(options) {
  return {
    "group-related-classes": createGroupRelatedClassesRule(options),
    "normalize-class-spacing": createNormalizeClassSpacingRule(options),
    "prefer-class-shorthand": createPreferClassShorthandRule(options),
    "sort-class-variants": createSortClassVariantsRule(options),
  };
}

function createRecommendedConfig(plugin) {
  return [
    {
      plugins: {
        [pluginId]: plugin,
      },
      rules: {
        [`${pluginId}/normalize-class-spacing`]: "warn",
        [`${pluginId}/prefer-class-shorthand`]: "warn",
        [`${pluginId}/group-related-classes`]: "warn",
        [`${pluginId}/sort-class-variants`]: "warn",
      },
    },
  ];
}

export function createPlugin(options = {}) {
  const plugin = {
    meta: {
      name: packageJson.name,
      namespace: pluginId,
      version: packageJson.version,
    },
    configs: {},
    rules: createRules(options),
  };

  Object.assign(plugin.configs, {
    "flat/recommended": createRecommendedConfig(plugin),
  });

  return plugin;
}
