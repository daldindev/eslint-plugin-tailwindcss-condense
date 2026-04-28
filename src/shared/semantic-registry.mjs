import { getVariantSignature, parseCandidate, printCandidate } from "./class-parser.mjs";
import { hasThemeValue } from "./theme.mjs";

const sides = ["top", "right", "bottom", "left"];
const corners = ["top-left", "top-right", "bottom-right", "bottom-left"];
const colorRoots = new Set([
  "amber",
  "black",
  "blue",
  "cyan",
  "current",
  "emerald",
  "fuchsia",
  "gray",
  "green",
  "grey",
  "indigo",
  "inherit",
  "lime",
  "neutral",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "slate",
  "stone",
  "teal",
  "transparent",
  "violet",
  "white",
  "yellow",
  "zinc",
]);
const textSizes = new Set(["xs", "sm", "base", "lg", "xl"]);
const radiusValues = new Set([
  null,
  "none",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "full",
]);
const borderWidthValues = new Set([null, "0", "2", "4", "8"]);
const overflowValues = new Set(["auto", "hidden", "clip", "visible", "scroll"]);
const overscrollValues = new Set(["auto", "contain", "none"]);
const placementValues = new Set([
  "around",
  "baseline",
  "between",
  "center",
  "end",
  "evenly",
  "normal",
  "start",
  "stretch",
]);
const displayClasses = new Set([
  "block",
  "contents",
  "flow-root",
  "flex",
  "grid",
  "hidden",
  "inline",
  "inline-block",
  "inline-flex",
  "inline-grid",
  "inline-table",
  "list-item",
  "table",
  "table-caption",
  "table-cell",
  "table-column",
  "table-column-group",
  "table-footer-group",
  "table-header-group",
  "table-row",
  "table-row-group",
]);
const flexDirectionClasses = new Set([
  "flex-col",
  "flex-col-reverse",
  "flex-row",
  "flex-row-reverse",
]);
const flexWrapClasses = new Set(["flex-nowrap", "flex-wrap", "flex-wrap-reverse"]);
const positionClasses = new Set(["absolute", "fixed", "relative", "static", "sticky"]);
const textAlignClasses = new Set(["text-center", "text-end", "text-justify", "text-left", "text-right", "text-start"]);
const fontWeightClasses = new Set([
  "font-black",
  "font-bold",
  "font-extrabold",
  "font-extralight",
  "font-light",
  "font-medium",
  "font-normal",
  "font-semibold",
  "font-thin",
]);

function createRoot(family, root, coverage, valueKind, options = {}) {
  return {
    allowNegative: options.allowNegative ?? false,
    coverage,
    family,
    root,
    valueKind,
  };
}

function boxRoots(family, prefix, valueKind, options = {}) {
  return [
    createRoot(family, prefix, sides, valueKind, options),
    createRoot(family, `${prefix}x`, ["left", "right"], valueKind, options),
    createRoot(family, `${prefix}y`, ["top", "bottom"], valueKind, options),
    createRoot(family, `${prefix}t`, ["top"], valueKind, options),
    createRoot(family, `${prefix}r`, ["right"], valueKind, options),
    createRoot(family, `${prefix}b`, ["bottom"], valueKind, options),
    createRoot(family, `${prefix}l`, ["left"], valueKind, options),
    createRoot(family, `${prefix}s`, ["left"], valueKind, options),
    createRoot(family, `${prefix}e`, ["right"], valueKind, options),
  ];
}

function scrollBoxRoots(family, prefix, valueKind, options = {}) {
  return [
    createRoot(family, prefix, sides, valueKind, options),
    createRoot(family, `${prefix}x`, ["left", "right"], valueKind, options),
    createRoot(family, `${prefix}y`, ["top", "bottom"], valueKind, options),
    createRoot(family, `${prefix}t`, ["top"], valueKind, options),
    createRoot(family, `${prefix}r`, ["right"], valueKind, options),
    createRoot(family, `${prefix}b`, ["bottom"], valueKind, options),
    createRoot(family, `${prefix}l`, ["left"], valueKind, options),
    createRoot(family, `${prefix}s`, ["left"], valueKind, options),
    createRoot(family, `${prefix}e`, ["right"], valueKind, options),
  ];
}

function borderSideRoots(family, valueKind) {
  return [
    createRoot(family, "border", sides, valueKind),
    createRoot(family, "border-x", ["left", "right"], valueKind),
    createRoot(family, "border-y", ["top", "bottom"], valueKind),
    createRoot(family, "border-t", ["top"], valueKind),
    createRoot(family, "border-r", ["right"], valueKind),
    createRoot(family, "border-b", ["bottom"], valueKind),
    createRoot(family, "border-l", ["left"], valueKind),
    createRoot(family, "border-s", ["left"], valueKind),
    createRoot(family, "border-e", ["right"], valueKind),
  ];
}

function radiusRoots() {
  return [
    createRoot("border-radius", "rounded", corners, "radius"),
    createRoot("border-radius", "rounded-t", ["top-left", "top-right"], "radius"),
    createRoot("border-radius", "rounded-r", ["top-right", "bottom-right"], "radius"),
    createRoot("border-radius", "rounded-b", ["bottom-right", "bottom-left"], "radius"),
    createRoot("border-radius", "rounded-l", ["top-left", "bottom-left"], "radius"),
    createRoot("border-radius", "rounded-s", ["top-left", "bottom-left"], "radius"),
    createRoot("border-radius", "rounded-e", ["top-right", "bottom-right"], "radius"),
    createRoot("border-radius", "rounded-tl", ["top-left"], "radius"),
    createRoot("border-radius", "rounded-tr", ["top-right"], "radius"),
    createRoot("border-radius", "rounded-br", ["bottom-right"], "radius"),
    createRoot("border-radius", "rounded-bl", ["bottom-left"], "radius"),
    createRoot("border-radius", "rounded-ss", ["top-left"], "radius"),
    createRoot("border-radius", "rounded-se", ["top-right"], "radius"),
    createRoot("border-radius", "rounded-ee", ["bottom-right"], "radius"),
    createRoot("border-radius", "rounded-es", ["bottom-left"], "radius"),
  ];
}

const shorthandRoots = [
  ...boxRoots("padding", "p", "spacing"),
  ...boxRoots("margin", "m", "spacing", { allowNegative: true }),
  ...scrollBoxRoots("scroll-padding", "scroll-p", "spacing"),
  ...scrollBoxRoots("scroll-margin", "scroll-m", "spacing", { allowNegative: true }),
  ...boxRoots("inset", "inset-", "spacing", { allowNegative: true }),
  createRoot("inset", "inset", sides, "spacing", { allowNegative: true }),
  createRoot("inset", "top", ["top"], "spacing", { allowNegative: true }),
  createRoot("inset", "right", ["right"], "spacing", { allowNegative: true }),
  createRoot("inset", "bottom", ["bottom"], "spacing", { allowNegative: true }),
  createRoot("inset", "left", ["left"], "spacing", { allowNegative: true }),
  createRoot("inset", "start", ["left"], "spacing", { allowNegative: true }),
  createRoot("inset", "end", ["right"], "spacing", { allowNegative: true }),
  createRoot("gap", "gap", ["x", "y"], "spacing"),
  createRoot("gap", "gap-x", ["x"], "spacing"),
  createRoot("gap", "gap-y", ["y"], "spacing"),
  createRoot("size", "size", ["width", "height"], "size"),
  createRoot("size", "w", ["width"], "size"),
  createRoot("size", "h", ["height"], "size"),
  ...borderSideRoots("border-width", "border-width"),
  ...borderSideRoots("border-color", "color"),
  ...radiusRoots(),
  createRoot("place-content", "place-content", ["align", "justify"], "placement"),
  createRoot("place-content", "content", ["align"], "placement"),
  createRoot("place-content", "justify", ["justify"], "placement"),
  createRoot("place-items", "place-items", ["align", "justify"], "placement"),
  createRoot("place-items", "items", ["align"], "placement"),
  createRoot("place-items", "justify-items", ["justify"], "placement"),
  createRoot("place-self", "place-self", ["align", "justify"], "placement"),
  createRoot("place-self", "self", ["align"], "placement"),
  createRoot("place-self", "justify-self", ["justify"], "placement"),
  createRoot("overflow", "overflow", ["x", "y"], "overflow"),
  createRoot("overflow", "overflow-x", ["x"], "overflow"),
  createRoot("overflow", "overflow-y", ["y"], "overflow"),
  createRoot("overscroll", "overscroll", ["x", "y"], "overscroll"),
  createRoot("overscroll", "overscroll-x", ["x"], "overscroll"),
  createRoot("overscroll", "overscroll-y", ["y"], "overscroll"),
  createRoot("translate", "translate", ["x", "y"], "spacing", { allowNegative: true }),
  createRoot("translate", "translate-x", ["x"], "spacing", { allowNegative: true }),
  createRoot("translate", "translate-y", ["y"], "spacing", { allowNegative: true }),
  createRoot("translate", "translate-z", ["z"], "spacing", { allowNegative: true }),
  createRoot("scale", "scale", ["x", "y", "z"], "scale", { allowNegative: true }),
  createRoot("scale", "scale-x", ["x"], "scale", { allowNegative: true }),
  createRoot("scale", "scale-y", ["y"], "scale", { allowNegative: true }),
  createRoot("scale", "scale-z", ["z"], "scale", { allowNegative: true }),
  createRoot("skew", "skew", ["x", "y"], "spacing", { allowNegative: true }),
  createRoot("skew", "skew-x", ["x"], "spacing", { allowNegative: true }),
  createRoot("skew", "skew-y", ["y"], "spacing", { allowNegative: true }),
  createRoot("border-spacing", "border-spacing", ["x", "y"], "spacing"),
  createRoot("border-spacing", "border-spacing-x", ["x"], "spacing"),
  createRoot("border-spacing", "border-spacing-y", ["y"], "spacing"),
].sort((left, right) => right.root.length - left.root.length);

function isArbitraryValue(value) {
  return (
    typeof value === "string" &&
    ((value.startsWith("[") && value.endsWith("]")) ||
      (value.startsWith("(") && value.endsWith(")")))
  );
}

function isNumericScaleValue(value) {
  return /^(?:0|px|\d+(?:\.\d+)?|\d+\/\d+)$/u.test(value);
}

function isColorValue(value, theme) {
  if (value == null) {
    return false;
  }

  if (isArbitraryValue(value)) {
    return /(?:^|[\[:])(?:#|rgb|hsl|oklch|lab|lch|color|var\(|--color-)/iu.test(value);
  }

  if (hasThemeValue(theme, "color", value)) {
    return true;
  }

  const [root] = value.split("-");

  return colorRoots.has(root);
}

function isTextSizeValue(value, theme) {
  if (value == null) {
    return false;
  }

  if (isArbitraryValue(value)) {
    return /(?:length:|size:|^\[(?:calc|clamp|min|max|var|\d))/iu.test(value);
  }

  if (hasThemeValue(theme, "text", value) || hasThemeValue(theme, "font-size", value)) {
    return true;
  }

  if (textSizes.has(value)) {
    return true;
  }

  return /^(\d+xl)$/u.test(value);
}

function isSpacingValue(value, theme) {
  return (
    value != null &&
    (isArbitraryValue(value) ||
      isNumericScaleValue(value) ||
      hasThemeValue(theme, "spacing", value))
  );
}

function isSizeValue(value, theme) {
  return (
    value != null &&
    (isSpacingValue(value, theme) ||
      ["auto", "dvh", "dvw", "fit", "full", "lvh", "lvw", "max", "min", "screen", "svh", "svw"].includes(value))
  );
}

function isRadiusValue(value, theme) {
  return (
    radiusValues.has(value) ||
    isArbitraryValue(value) ||
    (value != null && hasThemeValue(theme, "radius", value))
  );
}

function isBorderWidthValue(value, theme) {
  return (
    borderWidthValues.has(value) ||
    isArbitraryValue(value) ||
    (value != null && hasThemeValue(theme, "border-width", value))
  );
}

function isScaleValue(value, theme) {
  return (
    value != null &&
    (isArbitraryValue(value) ||
      /^\d+(?:\.\d+)?$/u.test(value) ||
      hasThemeValue(theme, "scale", value))
  );
}

function isKnownValue(valueKind, value, theme) {
  switch (valueKind) {
    case "border-width":
      return isBorderWidthValue(value, theme);
    case "color":
      return isColorValue(value, theme);
    case "overflow":
      return value != null && overflowValues.has(value);
    case "overscroll":
      return value != null && overscrollValues.has(value);
    case "placement":
      return value != null && placementValues.has(value);
    case "radius":
      return isRadiusValue(value, theme);
    case "scale":
      return isScaleValue(value, theme);
    case "size":
      return isSizeValue(value, theme);
    case "spacing":
      return isSpacingValue(value, theme);
    default:
      return false;
  }
}

function getValueForRoot(base, root) {
  if (base === root) {
    return null;
  }

  if (base.startsWith(`${root}-`)) {
    return base.slice(root.length + 1);
  }

  return undefined;
}

function getCoverageSignature(coverage) {
  return [...coverage].sort().join("|");
}

export function getShorthandEntry(candidate, theme) {
  for (const descriptor of shorthandRoots) {
    const value = getValueForRoot(candidate.base, descriptor.root);

    if (value === undefined) {
      continue;
    }

    if (candidate.negative && !descriptor.allowNegative) {
      continue;
    }

    if (!isKnownValue(descriptor.valueKind, value, theme)) {
      continue;
    }

    return {
      candidate,
      coverage: descriptor.coverage,
      coverageSignature: getCoverageSignature(descriptor.coverage),
      descriptor,
      family: descriptor.family,
      negative: candidate.negative,
      value,
      variantSignature: getVariantSignature(candidate),
    };
  }

  return null;
}

export function buildShorthandToken(entries, theme) {
  const [firstEntry] = entries;
  const coverage = entries.flatMap((entry) => entry.coverage);
  const coverageSignature = getCoverageSignature(coverage);
  const descriptor = shorthandRoots.find(
    (root) =>
      root.family === firstEntry.family &&
      getCoverageSignature(root.coverage) === coverageSignature &&
      isKnownValue(root.valueKind, firstEntry.value, theme),
  );

  if (descriptor == null) {
    return null;
  }

  const base =
    firstEntry.value == null ? descriptor.root : `${descriptor.root}-${firstEntry.value}`;

  return printCandidate(firstEntry.candidate, base);
}

function getPrefixFamily(base, theme) {
  if (base.startsWith("bg-")) {
    const value = base.slice(3);

    if (["auto", "bottom", "center", "fixed", "local", "repeat", "scroll", "top"].includes(value)) {
      return `background-${value}`;
    }

    if (isColorValue(value, theme)) {
      return "background-color";
    }

    return null;
  }

  if (base.startsWith("text-")) {
    const value = base.slice(5);

    if (isTextSizeValue(value, theme)) {
      return "text-size";
    }

    if (isColorValue(value, theme)) {
      return "text-color";
    }

    return null;
  }

  if (base.startsWith("font-")) {
    return fontWeightClasses.has(base) ? "font-weight" : "font-family";
  }

  if (base.startsWith("leading-")) {
    return "line-height";
  }

  if (base.startsWith("tracking-")) {
    return "letter-spacing";
  }

  if (base.startsWith("grid-cols-")) {
    return "grid-template-columns";
  }

  if (base.startsWith("grid-rows-")) {
    return "grid-template-rows";
  }

  if (base.startsWith("col-")) {
    return "grid-column";
  }

  if (base.startsWith("row-")) {
    return "grid-row";
  }

  if (base.startsWith("ring-")) {
    return isColorValue(base.slice(5), theme) ? "ring-color" : "ring-width";
  }

  if (base.startsWith("outline-")) {
    return isColorValue(base.slice(8), theme) ? "outline-color" : "outline-width";
  }

  return null;
}

export function getSemanticFamily(token, theme) {
  const candidate = typeof token === "string" ? parseCandidate(token) : token;

  if (candidate == null) {
    return null;
  }

  const shorthandEntry = getShorthandEntry(candidate, theme);

  if (shorthandEntry != null) {
    return shorthandEntry.family;
  }

  if (candidate.base.startsWith("[") && candidate.base.includes(":")) {
    return `arbitrary:${candidate.base.slice(1, candidate.base.indexOf(":"))}`;
  }

  if (displayClasses.has(candidate.base)) {
    return "display";
  }

  if (flexDirectionClasses.has(candidate.base)) {
    return "flex-direction";
  }

  if (flexWrapClasses.has(candidate.base)) {
    return "flex-wrap";
  }

  if (positionClasses.has(candidate.base)) {
    return "position";
  }

  if (textAlignClasses.has(candidate.base)) {
    return "text-align";
  }

  if (fontWeightClasses.has(candidate.base)) {
    return "font-weight";
  }

  return getPrefixFamily(candidate.base, theme);
}

export function getShorthandGroupKey(entry) {
  return [
    entry.family,
    entry.variantSignature,
    entry.candidate.important ? "important" : "regular",
  ].join("|");
}

export function hasOverlappingCoverage(entries) {
  const seen = new Set();

  for (const entry of entries) {
    for (const slot of entry.coverage) {
      if (seen.has(slot)) {
        return true;
      }

      seen.add(slot);
    }
  }

  return false;
}
