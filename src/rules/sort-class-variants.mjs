import { parseClassString, rebuildClassString } from "../shared/class-attributes.mjs";
import { parseCandidate, printCandidate } from "../shared/class-parser.mjs";
import {
  getSemanticFamily,
  getShorthandEntry,
  getShorthandGroupKey,
  hasOverlappingCoverage,
} from "../shared/semantic-registry.mjs";
import { getTheme } from "../shared/theme.mjs";
import { createClassStringVisitors } from "../shared/rule-visitors.mjs";
import {
  getGroupsIgnoringNull,
  mergeIgnoredTokens,
} from "../shared/token-groups.mjs";
import { compareCandidateVariantOrder } from "../shared/variants.mjs";

function hasDuplicateOrOverlappingEntries(entries, theme) {
  const seenTokens = new Set();
  const shorthandEntriesByKey = new Map();

  for (const { candidate, family, normalizedToken } of entries) {
    if (family == null) {
      continue;
    }

    if (seenTokens.has(normalizedToken)) {
      return true;
    }

    seenTokens.add(normalizedToken);

    const entry = candidate == null ? null : getShorthandEntry(candidate, theme);

    if (entry == null) {
      continue;
    }

    const key = getShorthandGroupKey(entry);
    const shorthandEntries = shorthandEntriesByKey.get(key) ?? [];
    shorthandEntries.push(entry);
    shorthandEntriesByKey.set(key, shorthandEntries);
  }

  for (const shorthandEntries of shorthandEntriesByKey.values()) {
    if (hasOverlappingCoverage(shorthandEntries)) {
      return true;
    }
  }

  return false;
}

export default function createSortClassVariantsRule(options = {}) {
  return {
    meta: {
      docs: {
        description:
          "Order Tailwind variants only inside the same semantic family.",
        url: "https://github.com/daldindev/eslint-plugin-tailwindcss-condense/blob/main/docs/rules/sort-class-variants.md",
      },
      fixable: "code",
      messages: {
        sortClassVariants:
          "Order Tailwind variants inside this semantic class family.",
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
        const candidateInfo = parsedClassString.tokens.map((token) => {
          const candidate = parseCandidate(token);

          if (candidate == null) {
            return {
              candidate: null,
              family: null,
              normalizedToken: token,
            };
          }

          return {
            candidate,
            family: getSemanticFamily(candidate, theme),
            normalizedToken: printCandidate(candidate),
          };
        });
        const replacements = [];

        for (const group of getGroupsIgnoringNull(
          candidateInfo.map((entry) => entry.family),
        )) {
          const entries = candidateInfo.slice(group.start, group.end + 1);
          const originalTokens = parsedClassString.tokens.slice(
            group.start,
            group.end + 1,
          );

          if (hasDuplicateOrOverlappingEntries(entries, theme)) {
            continue;
          }

          const nextKnownTokens = entries
            .filter((entry) => entry.family != null)
            .toSorted((left, right) => {
              if (left.candidate == null || right.candidate == null) {
                return 0;
              }

              return compareCandidateVariantOrder(left.candidate, right.candidate);
            })
            .map((entry) => entry.normalizedToken);
          const nextTokens = mergeIgnoredTokens(
            originalTokens,
            entries.map((entry) => entry.family),
            nextKnownTokens,
          );

          if (originalTokens.join(" ") === nextTokens.join(" ")) {
            continue;
          }

          replacements.push({
            end: group.end,
            start: group.start,
            tokens: nextTokens,
          });
        }

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
          messageId: "sortClassVariants",
          node: classAttribute.node,
        });
      }

      return createClassStringVisitors(context, options, checkTarget);
    },
  };
}
