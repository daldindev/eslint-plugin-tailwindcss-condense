import { parseClassString } from "../shared/class-attributes.mjs";
import { createClassStringVisitors } from "../shared/rule-visitors.mjs";

function normalizeClassSpacing(text) {
  return parseClassString(text).tokens.join(" ");
}

export default function createNormalizeClassSpacingRule(options = {}) {
  return {
    meta: {
      docs: {
        description:
          "Use a single space between Tailwind classes and trim surrounding class whitespace.",
        url: "https://github.com/daldindev/eslint-plugin-tailwindcss-condense/blob/main/docs/rules/normalize-class-spacing.md",
      },
      fixable: "code",
      messages: {
        normalizeClassSpacing:
          "Use a single space between classes and remove leading or trailing class whitespace.",
      },
      schema: [],
      type: "layout",
    },
    create(context) {
      function checkTarget(classAttribute) {
        const nextText = normalizeClassSpacing(classAttribute.text);

        if (nextText === classAttribute.text) {
          return;
        }

        context.report({
          fix(fixer) {
            return classAttribute.replaceText(fixer, nextText);
          },
          messageId: "normalizeClassSpacing",
          node: classAttribute.node,
        });
      }

      return createClassStringVisitors(context, options, checkTarget);
    },
  };
}
