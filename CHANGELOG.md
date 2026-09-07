# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

## [0.3.0] - 2026-09-07

### Changed

- `prefer-class-shorthand` collects mergeable utilities from anywhere in a class string instead of only from adjacent runs, so `pt-4 pl-2 pb-4 pr-2` collapses to `py-4 px-2`.
- `prefer-class-shorthand` drops utilities that the resulting shorthand already overrides on every side, so `size-8 w-6 h-6` collapses to `size-6`.

### Fixed

- `prefer-class-shorthand` no longer skips an entire class group when one utility of the same family carries a different value. `pt-4 pb-4 pl-2` previously reported nothing and now collapses to `py-4 pl-2`.
- `prefer-class-shorthand` no longer merges utilities that lose precedence once collapsed. Autofixing `size-8 justify-end w-6 h-6` produced `size-8 justify-end size-6`, which resolves to a different size.

## [0.2.0] - 2026-08-28

### Changed

- Added ESLint v10 support to `peerDependencies` while keeping v9 supported.
- Updated dev dependencies to ESLint v10, Tailwind CSS v4.3, and `vue-eslint-parser` v10.4.
- CI now runs the quality checks on Node.js 20, 22, and 24 against ESLint v9 and v10.

## [0.1.2] - 2026-05-01

### Added

- Added TypeScript declarations for the default plugin export and `createPlugin`.

## [0.1.1] - 2026-04-29

### Changed

- Improved README rule examples, framework guidance, and documentation links.

## [0.1.0] - 2026-04-28

### Added

- Initial MVP of `eslint-plugin-tailwindcss-condense`.
- `normalize-class-spacing`, `prefer-class-shorthand`, `group-related-classes`, and `sort-class-variants` rules.
- Support for static class strings in configured `callees`, including common helpers such as `clsx`, `cn`, `cva`, `tv`, and tagged templates like `tw`.
- Core Tailwind, `@theme`, and arbitrary value support without Tailwind internal APIs.
- Auto-discovery for common CSS theme entry files across Next.js, Vite, and other ESLint-based stacks.
