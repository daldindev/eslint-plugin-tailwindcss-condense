# `tailwindcss-condense/prefer-class-shorthand`

Prefer shorter equivalent Tailwind utilities when a class group can be safely represented by one shorthand class.

This rule is for semantic equivalence, not broad duplicate cleanup. It only reports when a known Tailwind utility group can be represented with fewer classes and the replacement preserves the same final coverage.

## What it checks

Covered shorthand families include spacing, scroll spacing, sizing, borders, border colors, placement, overflow, transforms, and rounded corner groups.

## Incorrect

```jsx
<div className="pt-4 pb-4" />
<div className="px-4 py-4" />
<div className="w-6 h-6" />
<div className="border-l-2 border-r-2" />
```

## Correct

```jsx
<div className="py-4" />
<div className="p-4" />
<div className="size-6" />
<div className="border-x-2" />
```

## Theme Tokens

Custom theme tokens are supported when they are declared with `@theme`:

```css
@theme {
  --spacing-gutter: 1rem;
}
```

```diff
- <div className="gap-x-gutter gap-y-gutter" />
+ <div className="gap-gutter" />
```

Custom `@utility` definitions are not inferred.

## Autofix and Safety

The rule is autofixable.

It preserves unknown or custom classes while evaluating known Tailwind utilities:

```diff
- <div className="pt-4 custom-class pb-4" />
+ <div className="py-4 custom-class" />
```

This includes overlapping utilities when the shorthand preserves the same final coverage:

```diff
- <div className="p-4 pt-4" />
+ <div className="p-4" />
```

The rule does not remove arbitrary duplicates such as `p-4 p-4`, does not infer project-defined `@utility` classes, and does not move classes across separate function arguments, array elements, or conditional branches.

## Options

This rule has no rule-level options. Use shared `settings.tailwindcssCondense` for theme files and class helper callees.
