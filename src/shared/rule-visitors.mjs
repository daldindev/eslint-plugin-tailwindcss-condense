import { getStaticClassAttribute } from "./class-attributes.mjs";
import {
  getCallExpressionClassTargets,
  getTaggedTemplateClassTarget,
} from "./callees.mjs";

export function createClassAttributeVisitors(context, checkNode, extraScriptVisitors = {}) {
  const scriptVisitors = {
    ...extraScriptVisitors,
    Attribute: checkNode,
    JSXAttribute: checkNode,
  };
  const templateVisitors = {
    VAttribute: checkNode,
  };
  const parserServices =
    context.sourceCode.parserServices ?? context.parserServices;

  if (typeof parserServices?.defineTemplateBodyVisitor === "function") {
    return parserServices.defineTemplateBodyVisitor(
      templateVisitors,
      scriptVisitors,
    );
  }

  return {
    ...scriptVisitors,
    ...templateVisitors,
  };
}

export function createClassStringVisitors(context, options, checkTarget) {
  const sourceCode = context.sourceCode;

  function checkAttributeNode(node) {
    const target = getStaticClassAttribute(node, sourceCode);

    if (target != null) {
      checkTarget(target);
    }
  }

  return createClassAttributeVisitors(context, checkAttributeNode, {
    CallExpression(node) {
      for (const target of getCallExpressionClassTargets(
        node,
        sourceCode,
        context,
        options,
      )) {
        checkTarget(target);
      }
    },
    TaggedTemplateExpression(node) {
      const target = getTaggedTemplateClassTarget(
        node,
        sourceCode,
        context,
        options,
      );

      if (target != null) {
        checkTarget(target);
      }
    },
  });
}
