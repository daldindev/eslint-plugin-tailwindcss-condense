import { parseClassString, rebuildClassString } from "../shared/class-attributes.mjs";
import { parseCandidate, printCandidate } from "../shared/class-parser.mjs";
import {
  buildShorthandToken,
  getShorthandEntry,
  getShorthandGroupKey,
  getSemanticFamily,
} from "../shared/semantic-registry.mjs";
import { getTheme } from "../shared/theme.mjs";
import { createClassStringVisitors } from "../shared/rule-visitors.mjs";
import { getGroupsIgnoringNull } from "../shared/token-groups.mjs";

function createReplacement(group, entries, ignoredTokens, theme) {
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

  const token = buildShorthandToken(getUniqueCoverageEntries(entries), theme);

  if (token == null) {
    return null;
  }

  return {
    end: group.end,
    start: group.start,
    tokens: [token, ...ignoredTokens],
  };
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
          const family = candidate == null ? null : getSemanticFamily(candidate, theme);
          const entry = candidate == null ? null : getShorthandEntry(candidate, theme);

          return {
            entry,
            ignored: family == null,
            key: entry == null ? null : getShorthandGroupKey(entry),
            token,
          };
        });
        const replacements = [];
        const groups = getGroupsIgnoringNull(tokenInfo.map((entry) => entry.key));

        for (const group of groups) {
          const groupInfo = tokenInfo.slice(group.start, group.end + 1);
          const groupEntries = groupInfo
            .map((entry) => entry.entry)
            .filter((entry) => entry != null);
          const ignoredTokens = groupInfo
            .filter((entry) => entry.entry == null)
            .map((entry) => entry.token);

          const replacement = createReplacement(
            group,
            groupEntries,
            ignoredTokens,
            theme,
          );

          if (replacement == null) {
            continue;
          }

          const originalTokens = parsedClassString.tokens.slice(
            group.start,
            group.end + 1,
          );

          if (replacement.tokens.length >= originalTokens.length) {
            continue;
          }

          replacements.push(replacement);
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
          messageId: "preferClassShorthand",
          node: classAttribute.node,
        });
      }

      return createClassStringVisitors(context, options, checkTarget);
    },
  };
}
