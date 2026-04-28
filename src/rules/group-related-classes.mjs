import { parseClassString, rebuildClassString } from "../shared/class-attributes.mjs";
import { parseCandidate, printCandidate } from "../shared/class-parser.mjs";
import {
  buildShorthandToken,
  getSemanticFamily,
  getShorthandEntry,
  getShorthandGroupKey,
  hasOverlappingCoverage,
} from "../shared/semantic-registry.mjs";
import { getTheme } from "../shared/theme.mjs";
import { createClassStringVisitors } from "../shared/rule-visitors.mjs";
import { getKnownSegments, mergeIgnoredTokens } from "../shared/token-groups.mjs";

function groupSegment(tokens, families) {
  const order = [];
  const groups = new Map();

  for (let index = 0; index < tokens.length; index += 1) {
    const family = families[index];

    if (family == null) {
      continue;
    }

    if (!groups.has(family)) {
      groups.set(family, []);
      order.push(family);
    }

    groups.get(family).push(tokens[index]);
  }

  return order.flatMap((family) => groups.get(family));
}

function canUseShorthand(entries, theme) {
  if (entries.length < 2) {
    return false;
  }

  const values = new Set(entries.map((entry) => entry.value));
  const negatives = new Set(entries.map((entry) => entry.negative));
  const families = new Set(entries.map((entry) => entry.family));

  if (values.size !== 1 || negatives.size !== 1 || families.size !== 1) {
    return false;
  }

  return buildShorthandToken(entries, theme) != null;
}

function getBlockedFamilies(tokenInfo, theme) {
  const blockedFamilies = new Set();
  const shorthandEntriesByKey = new Map();
  const tokensByFamily = new Map();

  for (const { candidate, family, token } of tokenInfo) {
    if (family == null) {
      continue;
    }

    const normalizedToken = candidate == null ? token : printCandidate(candidate);
    const tokens = tokensByFamily.get(family) ?? new Set();

    if (tokens.has(normalizedToken)) {
      blockedFamilies.add(family);
    }

    tokens.add(normalizedToken);
    tokensByFamily.set(family, tokens);

    const entry = candidate == null ? null : getShorthandEntry(candidate, theme);

    if (entry == null) {
      continue;
    }

    const key = getShorthandGroupKey(entry);
    const entries = shorthandEntriesByKey.get(key) ?? [];
    entries.push(entry);
    shorthandEntriesByKey.set(key, entries);
  }

  for (const entries of shorthandEntriesByKey.values()) {
    if (hasOverlappingCoverage(entries) || canUseShorthand(entries, theme)) {
      blockedFamilies.add(entries[0].family);
    }
  }

  return blockedFamilies;
}

export default function createGroupRelatedClassesRule(options = {}) {
  return {
    meta: {
      docs: {
        description:
          "Keep related Tailwind classes grouped by semantic family.",
        url: "https://github.com/daldindev/eslint-plugin-tailwindcss-condense/blob/main/docs/rules/group-related-classes.md",
      },
      fixable: "code",
      messages: {
        groupRelatedClasses:
          "Keep related Tailwind classes grouped by semantic family.",
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

          return {
            candidate,
            family: candidate == null ? null : getSemanticFamily(candidate, theme),
            token,
          };
        });
        const families = tokenInfo.map((entry) => entry.family);
        const blockedFamilies = getBlockedFamilies(tokenInfo, theme);
        const replacements = [];

        for (const segment of getKnownSegments(families)) {
          const segmentTokens = parsedClassString.tokens.slice(
            segment.start,
            segment.end + 1,
          );
          const segmentFamilies = families
            .slice(segment.start, segment.end + 1)
            .map((family) => (blockedFamilies.has(family) ? null : family));
          const nextKnownTokens = groupSegment(segmentTokens, segmentFamilies);
          const nextTokens = mergeIgnoredTokens(
            segmentTokens,
            segmentFamilies,
            nextKnownTokens,
          );

          if (segmentTokens.join(" ") === nextTokens.join(" ")) {
            continue;
          }

          replacements.push({
            end: segment.end,
            start: segment.start,
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
          messageId: "groupRelatedClasses",
          node: classAttribute.node,
        });
      }

      return createClassStringVisitors(context, options, checkTarget);
    },
  };
}
