# `tailwindcss-condense/group-related-classes`

Keep Tailwind classes in the same semantic family close together, including variant classes.

This rule improves local readability without enforcing a full Tailwind class order. It groups known utilities by behavior, so base, responsive, and state variants for the same family are easier to scan.

## Incorrect

```jsx
<div className="bg-red-500 text-white hover:bg-red-600" />
```

## Correct

```jsx
<div className="bg-red-500 hover:bg-red-600 text-white" />
```

## Semantic Families

Grouping is based on behavior, not text prefix:

```jsx
<div className="flex-row sm:flex-col flex" />
```

`flex-row` and `sm:flex-col` are `flex-direction`. `flex` is `display`, so it is not grouped with them.

## Autofix and Safety

The rule is autofixable.

Only known classes are moved. Unknown or custom tokens are preserved and ignored when deciding which known classes should be grouped.

The rule avoids groups that look unsafe to reorder, including duplicate tokens, overlapping shorthand coverage, or class groups that `prefer-class-shorthand` can reduce first.

## Options

This rule has no rule-level options. Use shared `settings.tailwindcssCondense` for theme files and class helper callees.
