import { sortVariants } from "./variants.mjs";

function splitTopLevel(value, separator) {
  const parts = [];
  let current = "";
  let quote = null;
  let squareDepth = 0;
  let roundDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const previous = value[index - 1];

    if (quote != null) {
      current += character;

      if (character === quote && previous !== "\\") {
        quote = null;
      }

      continue;
    }

    if (character === "\"" || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === "[") {
      squareDepth += 1;
      current += character;
      continue;
    }

    if (character === "]") {
      squareDepth = Math.max(0, squareDepth - 1);
      current += character;
      continue;
    }

    if (character === "(") {
      roundDepth += 1;
      current += character;
      continue;
    }

    if (character === ")") {
      roundDepth = Math.max(0, roundDepth - 1);
      current += character;
      continue;
    }

    if (squareDepth === 0 && roundDepth === 0 && character === separator) {
      parts.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  parts.push(current);

  return parts;
}

export function parseCandidate(token) {
  if (typeof token !== "string" || token.trim() === "") {
    return null;
  }

  const parts = splitTopLevel(token, ":");
  let base = parts.at(-1);

  if (base == null || base === "") {
    return null;
  }

  let important = false;

  if (base.startsWith("!")) {
    important = true;
    base = base.slice(1);
  }

  if (base.endsWith("!")) {
    important = true;
    base = base.slice(0, -1);
  }

  let negative = false;

  if (base.startsWith("-")) {
    negative = true;
    base = base.slice(1);
  }

  if (base === "") {
    return null;
  }

  return {
    base,
    important,
    negative,
    originalToken: token,
    variants: sortVariants(parts.slice(0, -1).filter(Boolean)),
  };
}

export function printCandidate(candidate, base = candidate.base) {
  const prefixes = [...candidate.variants];
  const utility = `${candidate.important ? "!" : ""}${candidate.negative ? "-" : ""}${base}`;

  return [...prefixes, utility].join(":");
}

export function getVariantSignature(candidate) {
  return candidate.variants.join(":");
}
