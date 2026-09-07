import { parseClassString, rebuildClassString } from "../shared/class-attributes.mjs";
import { parseCandidate, printCandidate } from "../shared/class-parser.mjs";
import {
  buildShorthandToken,
  getShorthandEntry,
  getShorthandGroupKey,
  getShorthandMergeKey,
} from "../shared/semantic-registry.mjs";
import { getTheme } from "../shared/theme.mjs";
import { createClassStringVisitors } from "../shared/rule-visitors.mjs";

function buildMergedToken(entries, theme) {
  if (entries.length < 2) {
    return null;
  }

  const values = new Set(entries.map((entry) => entry.value));
  const negatives = new Set(entries.map((entry) => entry.negative));
  const families = new Set(entries.map((entry) => entry.family));

  if (values.size !== 1 || negatives.size !== 1 || families.size !== 1) {
    return null;
  }

  const normalizedTokens = new Set(
    entries.map((entry) => printCandidate(entry.candidate)),
  );

  if (normalizedTokens.size === 1) {
    return null;
  }

  return buildShorthandToken(getUniqueCoverageEntries(entries), theme);
}

// Tailwind emits the broader utility of a family first, so the fewer sides a
// utility covers the later it lands and the more it wins. Coverage size is
// therefore the precedence rank, smaller winning.
function getRank(entries, slot) {
  return Math.min(
    ...entries
      .filter((entry) => entry.coverage.includes(slot))
      .map((entry) => entry.coverage.length),
  );
}

// Merging widens coverage, which pushes the result earlier and lowers its
// precedence. That is only a problem where the merged utilities currently win a
// side outright and the shorthand would hand it to something else: in
// `pt-1 pl-2 p-2 px-4`, folding `pl-2` into `p-2` gives the left side to `px-4`.
// A side that already loses keeps losing, so those stay mergeable.
function isCascadeSafe(entries, others, slots) {
  return [...slots].every((slot) => {
    const otherRank = getRank(others, slot);

    return getRank(entries, slot) >= otherRank || slots.size < otherRank;
  });
}

// A class the merge already outranks on every side it touches resolves to
// nothing, so it goes away with the merge instead of blocking it: `size-8` next
// to `w-6 h-6` is dead weight, and the three of them collapse to `size-6`.
function isShadowed(entry, entries) {
  return entry.coverage.every(
    (slot) => getRank(entries, slot) < entry.coverage.length,
  );
}

// Utilities that merge into one shorthand can sit anywhere in the class string,
// so they are collected by merge key rather than by contiguous run. Class order
// inside the attribute does not affect the generated CSS, which is what makes
// rewriting a token in place and dropping its partners elsewhere safe.
function getMerges(tokenInfo, theme) {
  const indicesByKey = new Map();
  const indicesByGroup = new Map();

  for (let index = 0; index < tokenInfo.length; index += 1) {
    const { entry, group, key } = tokenInfo[index];

    if (entry == null) {
      continue;
    }

    indicesByKey.set(key, [...(indicesByKey.get(key) ?? []), index]);
    indicesByGroup.set(group, [...(indicesByGroup.get(group) ?? []), index]);
  }

  const candidates = [];

  for (const indices of indicesByKey.values()) {
    const entries = indices.map((index) => tokenInfo[index].entry);
    const token = buildMergedToken(entries, theme);

    if (token != null) {
      candidates.push({ entries, indices, token });
    }
  }

  // A class that is itself part of a merge is never treated as dead weight for
  // another one, so no two merges can lay claim to the same class.
  const claimed = new Set(candidates.flatMap((candidate) => candidate.indices));
  const merges = [];

  for (const { entries, indices, token } of candidates) {
    const merged = new Set(indices);
    const others = indicesByGroup
      .get(tokenInfo[indices[0]].group)
      .filter((index) => !merged.has(index));
    const shadowed = others.filter(
      (index) =>
        !claimed.has(index) && isShadowed(tokenInfo[index].entry, entries),
    );
    const kept = others
      .filter((index) => !shadowed.includes(index))
      .map((index) => tokenInfo[index].entry);
    const mergedSlots = new Set(entries.flatMap((entry) => entry.coverage));

    if (!isCascadeSafe(entries, kept, mergedSlots)) {
      continue;
    }

    merges.push({ indices, shadowed, token });
  }

  return merges;
}

// One replacement per cluster of overlapping merges. Merges that do not overlap
// stay separate so the separators between them survive untouched.
function getSpan({ indices, shadowed }) {
  return {
    end: Math.max(...indices, ...shadowed),
    start: Math.min(...indices, ...shadowed),
  };
}

function createReplacements(tokenInfo, merges) {
  const tokenByIndex = new Map();
  const droppedIndices = new Set();

  for (const { indices, shadowed, token } of merges) {
    const [first, ...rest] = indices;

    tokenByIndex.set(first, token);

    for (const index of [...rest, ...shadowed]) {
      droppedIndices.add(index);
    }
  }

  const clusters = [];

  for (const merge of merges.toSorted(
    (left, right) => getSpan(left).start - getSpan(right).start,
  )) {
    const { end, start } = getSpan(merge);
    const previous = clusters.at(-1);

    if (previous != null && start <= previous.end) {
      previous.end = Math.max(previous.end, end);
      continue;
    }

    clusters.push({ end, start });
  }

  return clusters.map(({ end, start }) => {
    const tokens = [];

    for (let index = start; index <= end; index += 1) {
      if (droppedIndices.has(index)) {
        continue;
      }

      tokens.push(tokenByIndex.get(index) ?? tokenInfo[index].token);
    }

    return { end, start, tokens };
  });
}

function getUniqueCoverageEntries(entries) {
  const seen = new Set();
  const uniqueEntries = [];

  for (const entry of entries) {
    const coverage = entry.coverage.filter((slot) => {
      if (seen.has(slot)) {
        return false;
      }

      seen.add(slot);
      return true;
    });

    if (coverage.length > 0) {
      uniqueEntries.push({
        ...entry,
        coverage,
      });
    }
  }

  return uniqueEntries;
}

export default function createPreferClassShorthandRule(options = {}) {
  return {
    meta: {
      docs: {
        description: "Prefer the shortest equivalent Tailwind shorthand.",
        url: "https://github.com/daldindev/eslint-plugin-tailwindcss-condense/blob/main/docs/rules/prefer-class-shorthand.md",
      },
      fixable: "code",
      messages: {
        preferClassShorthand:
          "Use the shortest equivalent Tailwind shorthand for this class group.",
      },
      schema: [],
      type: "suggestion",
    },
    create(context) {
      function checkTarget(classAttribute) {
        const parsedClassString = parseClassString(classAttribute.text);

        if (parsedClassString.tokens.length === 0) {
          return;
        }

        const theme = getTheme(context, options);
        const tokenInfo = parsedClassString.tokens.map((token) => {
          const candidate = parseCandidate(token);
          const entry = candidate == null ? null : getShorthandEntry(candidate, theme);

          return {
            entry,
            group: entry == null ? null : getShorthandGroupKey(entry),
            key: entry == null ? null : getShorthandMergeKey(entry),
            token,
          };
        });
        const merges = getMerges(tokenInfo, theme);

        if (merges.length === 0) {
          return;
        }

        const replacements = createReplacements(tokenInfo, merges).filter(
          (replacement) =>
            replacement.tokens.length < replacement.end - replacement.start + 1,
        );

        if (replacements.length === 0) {
          return;
        }

        const nextText = rebuildClassString(parsedClassString, replacements);

        if (nextText === classAttribute.text) {
          return;
        }

        context.report({
          fix(fixer) {
            return classAttribute.replaceText(fixer, nextText);
          },
          messageId: "preferClassShorthand",
          node: classAttribute.node,
        });
      }

      return createClassStringVisitors(context, options, checkTarget);
    },
  };
}
