# `tailwindcss-condense/normalize-class-spacing`

Normalize whitespace in static Tailwind class strings.

This rule keeps class strings predictable before other rules apply. It trims surrounding whitespace and collapses repeated separators between parsed class tokens to a single space.

## Incorrect

```jsx
<div className=" pt-4 pb-4" />
<div className="pt-4 pb-4 " />
<div className="pt-4  pb-4" />
```

## Correct

```jsx
<div className="pt-4 pb-4" />
```

## Autofix and Safety

The rule is autofixable.

Whitespace inside a single parsed class token is preserved, including arbitrary values and function-like arbitrary values. Dynamic template literals are ignored.

## Options

This rule has no rule-level options. Use shared `settings.tailwindcssCondense.callees` to control which helper functions and tagged templates are checked.
