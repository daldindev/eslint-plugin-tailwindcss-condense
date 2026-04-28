import { getStaticStringTarget } from "./class-attributes.mjs";

export const DEFAULT_CALLEES = [
  "classnames",
  "classNames",
  "clsx",
  "cn",
  "cx",
  "cva",
  "tv",
  "ctl",
  "tw",
  "twMerge",
  "twJoin",
];

const objectKeyCallees = new Set([
  "classnames",
  "classNames",
  "clsx",
  "cn",
  "cx",
  "twMerge",
  "twJoin",
]);
const variantFactoryCallees = new Set(["cva", "tv"]);

function getSettings(context, options) {
  const settings = context.settings?.tailwindcssCondense ?? {};

  return {
    callees: settings.callees ?? options.callees ?? DEFAULT_CALLEES,
  };
}

function getPropertyName(property) {
  if (property.key?.type === "Identifier") {
    return property.key.name;
  }

  if (property.key?.type === "Literal" && typeof property.key.value === "string") {
    return property.key.value;
  }

  return null;
}

function getCalleeName(callee) {
  if (callee?.type === "Identifier") {
    return callee.name;
  }

  if (callee?.type === "MemberExpression" && !callee.computed) {
    return callee.property?.type === "Identifier" ? callee.property.name : null;
  }

  if (callee?.type === "MemberExpression" && callee.computed) {
    return typeof callee.property?.value === "string" ? callee.property.value : null;
  }

  return null;
}

function isMatchedCallee(name, callees) {
  return name != null && callees.includes(name);
}

function addTarget(targets, node, sourceCode, metadata) {
  const target = getStaticStringTarget(node, sourceCode, metadata);

  if (target != null) {
    targets.push(target);
    return true;
  }

  return false;
}

function collectClassValueTargets(node, sourceCode, targets, metadata = {}) {
  if (node == null) {
    return;
  }

  if (addTarget(targets, node, sourceCode, metadata)) {
    return;
  }

  switch (node.type) {
    case "ArrayExpression":
      for (const element of node.elements) {
        collectClassValueTargets(element, sourceCode, targets, metadata);
      }
      return;
    case "ConditionalExpression":
      collectClassValueTargets(node.consequent, sourceCode, targets, metadata);
      collectClassValueTargets(node.alternate, sourceCode, targets, metadata);
      return;
    case "LogicalExpression":
      collectClassValueTargets(node.left, sourceCode, targets, metadata);
      collectClassValueTargets(node.right, sourceCode, targets, metadata);
      return;
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TypeCastExpression":
      collectClassValueTargets(node.expression, sourceCode, targets, metadata);
      return;
    default:
      return;
  }
}

function collectObjectTargets(node, sourceCode, targets, includeKeys, metadata) {
  for (const property of node.properties) {
    if (property == null || property.type === "SpreadElement") {
      continue;
    }

    if (includeKeys) {
      collectClassValueTargets(property.key, sourceCode, targets, metadata);
      continue;
    }

    collectGenericTargets(property.value, sourceCode, targets, includeKeys, metadata);
  }
}

function collectGenericTargets(node, sourceCode, targets, includeKeys, metadata = {}) {
  if (node == null) {
    return;
  }

  if (addTarget(targets, node, sourceCode, metadata)) {
    return;
  }

  switch (node.type) {
    case "ArrayExpression":
      for (const element of node.elements) {
        collectGenericTargets(element, sourceCode, targets, includeKeys, metadata);
      }
      return;
    case "ObjectExpression":
      collectObjectTargets(node, sourceCode, targets, includeKeys, metadata);
      return;
    case "ConditionalExpression":
      collectGenericTargets(node.consequent, sourceCode, targets, includeKeys, metadata);
      collectGenericTargets(node.alternate, sourceCode, targets, includeKeys, metadata);
      return;
    case "LogicalExpression":
      collectGenericTargets(node.left, sourceCode, targets, includeKeys, metadata);
      collectGenericTargets(node.right, sourceCode, targets, includeKeys, metadata);
      return;
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TypeCastExpression":
      collectGenericTargets(node.expression, sourceCode, targets, includeKeys, metadata);
      return;
    default:
      return;
  }
}

function collectSlotsTargets(node, sourceCode, targets, metadata) {
  if (node?.type !== "ObjectExpression") {
    collectClassValueTargets(node, sourceCode, targets, metadata);
    return;
  }

  for (const property of node.properties) {
    if (property == null || property.type === "SpreadElement") {
      continue;
    }

    collectClassValueTargets(property.value, sourceCode, targets, metadata);
  }
}

function collectVariantMapTargets(node, sourceCode, targets, metadata) {
  if (node?.type !== "ObjectExpression") {
    return;
  }

  for (const variantProperty of node.properties) {
    if (
      variantProperty == null ||
      variantProperty.type === "SpreadElement" ||
      variantProperty.value?.type !== "ObjectExpression"
    ) {
      continue;
    }

    for (const optionProperty of variantProperty.value.properties) {
      if (optionProperty == null || optionProperty.type === "SpreadElement") {
        continue;
      }

      collectClassValueTargets(optionProperty.value, sourceCode, targets, metadata);
    }
  }
}

function collectCompoundTargets(node, sourceCode, targets, metadata) {
  if (node?.type !== "ArrayExpression") {
    return;
  }

  for (const element of node.elements) {
    if (element?.type !== "ObjectExpression") {
      continue;
    }

    for (const property of element.properties) {
      if (property == null || property.type === "SpreadElement") {
        continue;
      }

      const name = getPropertyName(property);

      if (name === "class" || name === "className") {
        collectClassValueTargets(property.value, sourceCode, targets, metadata);
      }
    }
  }
}

function collectVariantFactoryOptions(node, sourceCode, targets, metadata) {
  if (node?.type !== "ObjectExpression") {
    return;
  }

  for (const property of node.properties) {
    if (property == null || property.type === "SpreadElement") {
      continue;
    }

    const name = getPropertyName(property);

    if (name === "base") {
      collectClassValueTargets(property.value, sourceCode, targets, metadata);
      continue;
    }

    if (name === "slots") {
      collectSlotsTargets(property.value, sourceCode, targets, metadata);
      continue;
    }

    if (name === "variants") {
      collectVariantMapTargets(property.value, sourceCode, targets, metadata);
      continue;
    }

    if (name === "compoundVariants" || name === "compoundSlots") {
      collectCompoundTargets(property.value, sourceCode, targets, metadata);
    }
  }
}

function collectVariantFactoryTargets(node, sourceCode, targets, metadata) {
  if (node.arguments[0]?.type === "ObjectExpression") {
    collectVariantFactoryOptions(node.arguments[0], sourceCode, targets, metadata);
    return;
  }

  collectClassValueTargets(node.arguments[0], sourceCode, targets, metadata);
  collectVariantFactoryOptions(node.arguments[1], sourceCode, targets, metadata);
}

export function getCallExpressionClassTargets(node, sourceCode, context, options = {}) {
  const { callees } = getSettings(context, options);
  const calleeName = getCalleeName(node.callee);

  if (!isMatchedCallee(calleeName, callees)) {
    return [];
  }

  const targets = [];
  const metadata = {
    calleeName,
  };

  if (variantFactoryCallees.has(calleeName)) {
    collectVariantFactoryTargets(node, sourceCode, targets, metadata);
    return targets;
  }

  for (const argument of node.arguments) {
    collectGenericTargets(
      argument,
      sourceCode,
      targets,
      objectKeyCallees.has(calleeName),
      metadata,
    );
  }

  return targets;
}

export function getTaggedTemplateClassTarget(node, sourceCode, context, options = {}) {
  const { callees } = getSettings(context, options);
  const calleeName = getCalleeName(node.tag);

  if (!isMatchedCallee(calleeName, callees)) {
    return null;
  }

  return getStaticStringTarget(node.quasi, sourceCode, { calleeName });
}
