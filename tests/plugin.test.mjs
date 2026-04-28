import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

import defaultPlugin from "../src/index.mjs";
import { createPlugin } from "../src/create-plugin.mjs";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

test("default export exposes a synchronous ESLint plugin", () => {
  assert.equal(typeof defaultPlugin.then, "undefined");
  assert.equal(defaultPlugin.meta.name, "eslint-plugin-tailwindcss-condense");
  assert.equal(defaultPlugin.meta.version, packageJson.version);
  assert.equal(typeof defaultPlugin.rules["prefer-class-shorthand"], "object");
  assert.equal(typeof defaultPlugin.rules["group-related-classes"], "object");
  assert.equal(typeof defaultPlugin.rules["normalize-class-spacing"], "object");
  assert.equal(typeof defaultPlugin.rules["sort-class-variants"], "object");
});

test("createPlugin exposes the recommended flat config", () => {
  const plugin = createPlugin();
  const recommended = plugin.configs["flat/recommended"];

  assert.equal(Array.isArray(recommended), true);
  assert.equal(
    recommended[0].rules["tailwindcss-condense/normalize-class-spacing"],
    "warn",
  );
  assert.equal(
    recommended[0].rules["tailwindcss-condense/prefer-class-shorthand"],
    "warn",
  );
  assert.equal(
    recommended[0].rules["tailwindcss-condense/group-related-classes"],
    "warn",
  );
  assert.equal(
    recommended[0].rules["tailwindcss-condense/sort-class-variants"],
    "warn",
  );
});

test("runtime dependencies do not include Tailwind internals", () => {
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(
    fs.readFileSync(new URL("../src/plugin.mjs", import.meta.url), "utf8").includes(
      "__unstable__loadDesignSystem",
    ),
    false,
  );
});
