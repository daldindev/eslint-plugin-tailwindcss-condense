import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ESLint } from "eslint";
import vueParser from "vue-eslint-parser";

import { createPlugin } from "../src/create-plugin.mjs";

async function createProject(files) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "tw-condense-"));

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(directory, filePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content);
  }

  return directory;
}

async function lintText({ code, cwd, filePath = "src/view.jsx", languageOptions = {} }) {
  const plugin = createPlugin();
  const eslint = new ESLint({
    cwd,
    fix: true,
    overrideConfig: [
      {
        files: ["**/*.{js,jsx,vue}"],
        languageOptions: {
          ecmaVersion: "latest",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
          sourceType: "module",
          ...languageOptions,
        },
        plugins: {
          "tailwindcss-condense": plugin,
        },
        rules: {
          "tailwindcss-condense/normalize-class-spacing": "error",
          "tailwindcss-condense/prefer-class-shorthand": "error",
          "tailwindcss-condense/group-related-classes": "error",
          "tailwindcss-condense/sort-class-variants": "error",
        },
        settings: {
          tailwindcssCondense: {
            cwd,
          },
        },
      },
    ],
    overrideConfigFile: true,
  });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(cwd, filePath),
  });

  return result;
}

test("Next-style app/globals.css is auto-discovered", async () => {
  const cwd = await createProject({
    "app/globals.css": '@import "tailwindcss";\n@theme {\n  --spacing-gutter: 1rem;\n}\n',
  });
  const result = await lintText({
    code: 'const view = <div className="gap-x-gutter gap-y-gutter" />;',
    cwd,
  });

  assert.match(result.output, /className="gap-gutter"/u);
});

test("Vite-style src/index.css is auto-discovered", async () => {
  const cwd = await createProject({
    "src/index.css": '@import "tailwindcss";\n@theme {\n  --spacing-gutter: 1rem;\n}\n',
  });
  const result = await lintText({
    code: 'const view = <div className="gap-x-gutter gap-y-gutter" />;',
    cwd,
  });

  assert.match(result.output, /className="gap-gutter"/u);
});

test("settings.themeFiles supports custom CSS locations", async () => {
  const cwd = await createProject({
    "packages/web/styles/theme.css": '@theme {\n  --spacing-gutter: 1rem;\n}\n',
  });
  const plugin = createPlugin();
  const eslint = new ESLint({
    cwd,
    fix: true,
    overrideConfig: [
      {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
          ecmaVersion: "latest",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
          sourceType: "module",
        },
        plugins: {
          "tailwindcss-condense": plugin,
        },
        rules: {
          "tailwindcss-condense/prefer-class-shorthand": "error",
        },
        settings: {
          tailwindcssCondense: {
            cwd,
            themeFiles: ["packages/web/styles/theme.css"],
          },
        },
      },
    ],
    overrideConfigFile: true,
  });
  const [result] = await eslint.lintText(
    'const view = <div className="gap-x-gutter gap-y-gutter" />;',
    { filePath: path.join(cwd, "src/view.jsx") },
  );

  assert.match(result.output, /className="gap-gutter"/u);
});

test("projects without theme CSS still support core and arbitrary values", async () => {
  const cwd = await createProject({});
  const result = await lintText({
    code: 'const view = <div className="pt-[1rem] pb-[1rem]" />;',
    cwd,
  });

  assert.match(result.output, /className="py-\[1rem\]"/u);
});

test("recommended rules leave repeated classes unchanged", async () => {
  const cwd = await createProject({});
  const examples = [
    'const view = <div className="border border" />;',
    'const view = <div className="border bg-white border" />;',
    'const view = <div className="p-4 text-white p-4" />;',
    'const view = <div className="rounded flex rounded" />;',
  ];

  for (const code of examples) {
    const result = await lintText({
      code,
      cwd,
    });

    assert.equal(result.output ?? code, code);
    assert.equal(result.messages.length, 0);
  }
});

test("recommended rules reduce same-value overlapping classes", async () => {
  const cwd = await createProject({});
  const examples = [
    [
      'const view = <div className="border-t text-white border" />;',
      /className="border text-white"/u,
    ],
    [
      'const view = <div className="border-b flex border-t" />;',
      /className="border-y flex"/u,
    ],
    [
      'const view = <div className="border-t border-b relative border" />;',
      /className="border relative"/u,
    ],
    [
      'const view = <div className="border-t border-b text-center border-y" />;',
      /className="border-y text-center"/u,
    ],
    [
      'const view = <div className="w-6 bg-red-500 h-6 size-6" />;',
      /className="size-6 bg-red-500"/u,
    ],
  ];

  for (const [code, pattern] of examples) {
    const result = await lintText({
      code,
      cwd,
    });

    assert.match(result.output, pattern);
  }
});

test("recommended rules preserve unknown classes while fixing known classes", async () => {
  const cwd = await createProject({});
  const result = await lintText({
    code: 'const view = <div className="pt-4 custom-class pb-4" />;',
    cwd,
  });

  assert.match(result.output, /className="py-4 custom-class"/u);
});

test("Vue static class attributes are supported through vue-eslint-parser", async () => {
  const cwd = await createProject({
    "src/index.css": '@theme {\n  --spacing-gutter: 1rem;\n}\n',
  });
  const result = await lintText({
    code: '<template><div class="gap-x-gutter gap-y-gutter"></div></template>',
    cwd,
    filePath: "src/view.vue",
    languageOptions: {
      parser: vueParser,
    },
  });

  assert.match(result.output, /class="gap-gutter"/u);
});
