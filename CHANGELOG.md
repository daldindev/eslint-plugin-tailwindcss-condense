# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

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
