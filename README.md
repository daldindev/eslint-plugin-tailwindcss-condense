# eslint-plugin-tailwindcss-condense

Autofix Tailwind CSS class strings by collapsing safe equivalent utilities and keeping related variants close without loading Tailwind internals.

## Why use it

`eslint-plugin-tailwindcss-condense` is intentionally narrower than a global Tailwind class sorter. It focuses on fixes that reduce class noise while preserving semantic meaning:

- Collapse equivalent utility groups to shorter Tailwind shorthands.
- Keep related base, responsive, and state variants close together.
- Normalize variant chains without globally reordering unrelated utilities.
- Read Tailwind v4 `@theme` tokens without depending on Tailwind internal APIs.
- Touch only static class strings that ESLint can safely autofix.

## What it fixes

Equivalent utilities become shorter utilities:

```diff
- <div className="pt-4 pb-4 border-l-2 border-r-2" />
+ <div className="py-4 border-x-2" />
```

Related semantic families stay grouped:

```diff
- <div className="bg-red-500 text-white hover:bg-red-600" />
+ <div className="bg-red-500 hover:bg-red-600 text-white" />
```

Variants are ordered only inside the same semantic family:

```diff
- <div className="lg:p-8 sm:p-2 md:p-5" />
+ <div className="sm:p-2 md:p-5 lg:p-8" />
```

## Install

```bash
npm i -D eslint eslint-plugin-tailwindcss-condense tailwindcss
```

Requirements:

- Node.js `>=20.11`
- ESLint v9
- Tailwind CSS v4
- ESM flat config

## Quick Start

```js
import { defineConfig } from "eslint/config";
import tailwindcssCondense from "eslint-plugin-tailwindcss-condense";

export default defineConfig([
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
  },
  ...tailwindcssCondense.configs["flat/recommended"],
]);
```

Then run ESLint with autofix enabled:

```bash
npx eslint . --fix
```

For TypeScript, Vue, or other frameworks that need a custom parser, keep your existing parser setup and add `...tailwindcssCondense.configs["flat/recommended"]` after it. This plugin does not bundle a TypeScript or template parser.

## Presets

`flat/recommended` enables every current rule as a warning:

| Rule | Purpose | Autofix |
| --- | --- | --- |
| `tailwindcss-condense/normalize-class-spacing` | Trim and normalize class separators | Yes |
| `tailwindcss-condense/prefer-class-shorthand` | Collapse equivalent utilities to shorthands | Yes |
| `tailwindcss-condense/group-related-classes` | Keep same-family utilities close | Yes |
| `tailwindcss-condense/sort-class-variants` | Normalize and order variants inside a semantic family | Yes |

Manual rule setup:

```js
import tailwindcssCondense from "eslint-plugin-tailwindcss-condense";

export default [
  {
    plugins: {
      "tailwindcss-condense": tailwindcssCondense,
    },
    rules: {
      "tailwindcss-condense/normalize-class-spacing": "warn",
      "tailwindcss-condense/prefer-class-shorthand": "warn",
      "tailwindcss-condense/group-related-classes": "warn",
      "tailwindcss-condense/sort-class-variants": "warn",
    },
  },
];
```

## Theme Tokens

The plugin understands Tailwind core values, arbitrary values, and custom `@theme` tokens. It does not parse custom `@utility` definitions.

By default it auto-discovers common CSS entry files:

- `app/globals.css`
- `src/app/globals.css`
- `src/index.css`
- `src/main.css`
- `src/styles.css`
- `src/assets/main.css`
- `styles/globals.css`
- `app.css`
- `index.css`

For custom structures, set theme files explicitly:

```js
export default [
  {
    settings: {
      tailwindcssCondense: {
        themeFiles: ["packages/web/styles/theme.css"],
      },
    },
  },
];
```

Relative CSS imports from theme files are followed. Package imports, URLs, and `@utility` blocks are ignored.

## Configuration Reference

All options live under `settings.tailwindcssCondense` in ESLint flat config:

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `cwd` | `string` | `process.cwd()` | Base directory used to resolve theme files. |
| `themeFiles` | `string[]` | `null` | Explicit CSS files to parse for `@theme` tokens. |
| `autoDiscoverThemeFiles` | `boolean` | `true` | Enables the common CSS entry file lookup listed above. |
| `callees` | `string[]` | Common class helpers | Function and tag names whose static string values should be fixed. |

## Class Helper Functions

The rules also run inside static strings passed to known class helper functions and tagged templates.

Default `settings.tailwindcssCondense.callees`:

| Callee | Typical source | Support |
| --- | --- | --- |
| `classnames`, `classNames` | `classnames` | String args, arrays, conditional object keys |
| `clsx` | `clsx` | String args, arrays, conditional object keys |
| `cn` | shadcn/ui-style helper | String args, arrays, conditional object keys |
| `cx` | common alias / CVA helper | String args, arrays, conditional object keys |
| `cva` | `class-variance-authority` | Base classes, variants, compound variant `class`/`className` |
| `tv` | `tailwind-variants` | Base classes, slots, variants, compound variant classes |
| `twMerge`, `twJoin` | `tailwind-merge` | String args and arrays |
| `ctl`, `tw` | template literal helpers | Static tagged templates |

Override the list when your project uses a custom helper:

```js
export default [
  {
    settings: {
      tailwindcssCondense: {
        callees: ["cn", "buttonClasses"],
      },
    },
  },
];
```

Only static strings are fixed. Classes are not moved across separate function arguments, array elements, or conditional branches.

## Frameworks

The core support is ESLint AST based:

| Syntax | Requirement | Supported targets |
| --- | --- | --- |
| JSX/TSX | Your existing ESLint parser setup | Static `class` and `className` values |
| Vue | `vue-eslint-parser` | Static `class` attributes |
| Helper calls | Configured `callees` | Static strings, arrays, object keys, and supported CVA/TV shapes |
| Tagged templates | Configured tag names | Static template literals without expressions |

Svelte, Astro, and other template syntaxes are future candidates when their ESLint parsers expose stable static class attributes. Dynamic class construction is out of scope for the MVP.

## Rules

### `tailwindcss-condense/prefer-class-shorthand`

Collapses safe groups to equivalent shorthand utilities.

Examples:

- `pt-4 pb-4` -> `py-4`
- `p-4 pt-4` -> `p-4`
- `px-4 py-4` -> `p-4`
- `w-6 h-6` -> `size-6`
- `border-l-2 border-r-2` -> `border-x-2`
- `content-center custom-class justify-center` -> `place-content-center custom-class`
- `gap-x-gutter gap-y-gutter` -> `gap-gutter` when `--spacing-gutter` exists in `@theme`

Full docs: [`docs/rules/prefer-class-shorthand.md`](./docs/rules/prefer-class-shorthand.md)

### `tailwindcss-condense/normalize-class-spacing`

Trims surrounding class whitespace and collapses repeated separators to one space.

Examples:

- `" pt-4 pb-4"` -> `"pt-4 pb-4"`
- `"pt-4 pb-4 "` -> `"pt-4 pb-4"`
- `"pt-4  pb-4"` -> `"pt-4 pb-4"`

Full docs: [`docs/rules/normalize-class-spacing.md`](./docs/rules/normalize-class-spacing.md)

### `tailwindcss-condense/group-related-classes`

Moves known classes in the same semantic family closer together.

Example:

```diff
- bg-red-500 text-white hover:bg-red-600
+ bg-red-500 hover:bg-red-600 text-white
```

Full docs: [`docs/rules/group-related-classes.md`](./docs/rules/group-related-classes.md)

### `tailwindcss-condense/sort-class-variants`

Normalizes variant chains and orders variant classes only inside the same semantic family.

Examples:

- `lg:p-8 sm:p-2 md:p-5` -> `sm:p-2 md:p-5 lg:p-8`
- `hover:sm:bg-red-500` -> `sm:hover:bg-red-500`

Full docs: [`docs/rules/sort-class-variants.md`](./docs/rules/sort-class-variants.md)

## Scope and Non-Goals

In scope:

- Core Tailwind utility families with safe semantic equivalence
- `@theme` tokens
- Arbitrary values
- ESLint flat config
- Static class strings

Out of scope:

- Custom `@utility` inference
- Tailwind internal APIs
- Broad redundancy/conflict cleanup outside safe shorthand-equivalent reductions
- Dynamic classes
- Full global class sorting
- Tailwind v3 compatibility claims

## Compatibility with Class Sorters

This plugin can be used alongside tools such as `prettier-plugin-tailwindcss`. Use Prettier for canonical Tailwind class ordering when that is desired, and use this ESLint plugin for safe shorthand reductions and local semantic grouping.

Because the rules only operate on static strings and avoid Tailwind internals, projects can disable individual rules when another formatter owns that part of the class string.

## Contributing

Issues and pull requests are welcome when they stay inside the safe-fix scope. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local checks, test expectations, and release validation.

## License

MIT
