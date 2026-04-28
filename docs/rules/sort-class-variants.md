# `tailwindcss-condense/sort-class-variants`

Order variants inside the same semantic class family without globally sorting unrelated utilities.

This rule normalizes Tailwind variant chains and orders variant classes only when they belong to the same semantic family.

## Incorrect

```jsx
<div className="lg:p-8 sm:p-2 md:p-5" />
<div className="hover:sm:bg-red-500" />
```

## Correct

```jsx
<div className="sm:p-2 md:p-5 lg:p-8" />
<div className="sm:hover:bg-red-500" />
```

## Non-Goal

This rule does not globally reorder unrelated semantic families:

```jsx
<div className="bg-white md:bg-black text-black sm:text-white" />
```

`background-color` and `text-color` are handled independently.

## Autofix and Safety

The rule is autofixable.

Unknown or custom classes are ignored and preserved while sorting known classes in the same family.

The rule skips groups with duplicate tokens or overlapping shorthand coverage, because reordering those classes could change which utility wins.

## Options

This rule has no rule-level options. Use shared `settings.tailwindcssCondense` for theme files and class helper callees.
