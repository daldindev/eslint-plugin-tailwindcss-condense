# Contributing

Thanks for helping improve `eslint-plugin-tailwindcss-condense`.

## Local Setup

Use Node.js `>=20.11`.

```bash
npm ci
npm run check
```

## Project Scope

- Keep the public API limited to the default export and `create-plugin`.
- Do not use Tailwind internal APIs.
- Do not infer custom `@utility` definitions.
- Prefer safe autofixes over broad class cleanup.
- Keep compatibility focused on ESLint v9 and v10 flat config and Tailwind CSS v4.

## Pull Request Expectations

- Add tests for every rule behavior change.
- Update README and rule docs for user-visible changes.
- Include invalid and valid examples for new rule behavior.
- Preserve unknown or custom classes unless a rule explicitly owns the token.
- Keep docs clear about limitations and non-goals.
