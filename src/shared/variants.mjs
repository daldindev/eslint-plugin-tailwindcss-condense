const breakpointOrder = new Map([
  ["xs", 0],
  ["sm", 1],
  ["md", 2],
  ["lg", 3],
  ["xl", 4],
  ["2xl", 5],
]);

const stateOrder = new Map(
  [
    "first",
    "last",
    "only",
    "odd",
    "even",
    "visited",
    "checked",
    "empty",
    "enabled",
    "disabled",
    "target",
    "open",
    "default",
    "optional",
    "required",
    "valid",
    "invalid",
    "in-range",
    "out-of-range",
    "placeholder-shown",
    "autofill",
    "read-only",
    "indeterminate",
    "focus-within",
    "hover",
    "focus",
    "focus-visible",
    "active",
    "paused",
    "playing",
  ].map((name, index) => [name, index]),
);

const environmentOrder = new Map(
  [
    "dark",
    "motion-safe",
    "motion-reduce",
    "contrast-more",
    "contrast-less",
    "portrait",
    "landscape",
    "print",
  ].map((name, index) => [name, index]),
);

function getResponsiveRank(variant) {
  if (breakpointOrder.has(variant)) {
    return [10, breakpointOrder.get(variant), variant];
  }

  if (variant.startsWith("@")) {
    const container = variant.slice(1);

    if (breakpointOrder.has(container)) {
      return [20, breakpointOrder.get(container), variant];
    }
  }

  if (variant.startsWith("min-")) {
    const breakpoint = variant.slice(4);

    if (breakpointOrder.has(breakpoint)) {
      return [30, breakpointOrder.get(breakpoint), variant];
    }
  }

  if (variant.startsWith("max-")) {
    const breakpoint = variant.slice(4);

    if (breakpointOrder.has(breakpoint)) {
      return [40, breakpointOrder.get(breakpoint), variant];
    }
  }

  return null;
}

function getCompoundStateVariant(variant) {
  for (const prefix of ["group-", "peer-", "in-", "not-", "has-"]) {
    if (variant.startsWith(prefix)) {
      return {
        prefix,
        state: variant.slice(prefix.length),
      };
    }
  }

  return null;
}

function getVariantSortKey(variant) {
  const responsiveRank = getResponsiveRank(variant);

  if (responsiveRank != null) {
    return responsiveRank;
  }

  if (environmentOrder.has(variant)) {
    return [100, environmentOrder.get(variant), variant];
  }

  if (stateOrder.has(variant)) {
    return [200, stateOrder.get(variant), variant];
  }

  const compound = getCompoundStateVariant(variant);

  if (compound != null && stateOrder.has(compound.state)) {
    return [210, stateOrder.get(compound.state), compound.prefix, variant];
  }

  if (variant.startsWith("[") || variant.startsWith("@[")) {
    return [900, 0, variant];
  }

  return [800, 0, variant];
}

function compareKeys(left, right) {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? "";
    const rightValue = right[index] ?? "";

    if (leftValue === rightValue) {
      continue;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }

    return String(leftValue).localeCompare(String(rightValue), "en", {
      numeric: true,
      sensitivity: "base",
    });
  }

  return 0;
}

export function compareVariants(left, right) {
  return compareKeys(getVariantSortKey(left), getVariantSortKey(right));
}

export function sortVariants(variants) {
  return [...variants].sort(compareVariants);
}

export function compareCandidateVariantOrder(left, right) {
  if (left.variants.length !== right.variants.length) {
    if (left.variants.length === 0 || right.variants.length === 0) {
      return left.variants.length - right.variants.length;
    }
  }

  const limit = Math.min(left.variants.length, right.variants.length);

  for (let index = 0; index < limit; index += 1) {
    const result = compareVariants(left.variants[index], right.variants[index]);

    if (result !== 0) {
      return result;
    }
  }

  return left.variants.length - right.variants.length;
}
