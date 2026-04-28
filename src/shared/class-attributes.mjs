function escapeForQuote(text, quote) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(quote, `\\${quote}`);
}

function escapeForTemplate(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

export function quoteText(text, wrapper) {
  if (wrapper === "`") {
    return `\`${escapeForTemplate(text)}\``;
  }

  return `${wrapper}${escapeForQuote(text, wrapper)}${wrapper}`;
}

function getLiteralText(node) {
  return typeof node.value === "string" ? node.value : null;
}

function getTemplateText(node) {
  if (node.expressions.length > 0 || node.quasis.length !== 1) {
    return null;
  }

  return node.quasis[0].value.cooked;
}

function getAttributeName(node) {
  if (node.name?.type === "JSXIdentifier") {
    return node.name.name;
  }

  if (typeof node.name === "string") {
    return node.name;
  }

  return null;
}

function getVueAttributeName(node) {
  if (node.directive) {
    return null;
  }

  return typeof node.key?.name === "string" ? node.key.name : null;
}

export function getStaticStringTarget(node, sourceCode, metadata = {}) {
  if (node?.type === "Literal") {
    const text = getLiteralText(node);

    if (text == null) {
      return null;
    }

    const wrapper = sourceCode.getText(node).at(0) ?? "\"";

    return {
      ...metadata,
      node,
      text,
      replaceText(fixer, nextText) {
        return fixer.replaceText(node, quoteText(nextText, wrapper));
      },
    };
  }

  if (node?.type === "TemplateLiteral") {
    const text = getTemplateText(node);

    if (text == null) {
      return null;
    }

    return {
      ...metadata,
      node,
      text,
      replaceText(fixer, nextText) {
        return fixer.replaceText(node, quoteText(nextText, "`"));
      },
    };
  }

  return null;
}

function getQuotedLiteralAttribute(node, sourceCode, attributeName) {
  const text = getLiteralText(node.value);

  if (text == null) {
    return null;
  }

  const wrapper = sourceCode.getText(node.value).at(0) ?? "\"";

  return {
    attributeName,
    node: node.value,
    text,
    replaceText(fixer, nextText) {
      return fixer.replaceText(node.value, quoteText(nextText, wrapper));
    },
  };
}

function getExpressionAttribute(node, sourceCode, attributeName) {
  if (node.value?.type !== "JSXExpressionContainer") {
    return null;
  }

  const expression = node.value.expression;

  return getStaticStringTarget(expression, sourceCode, { attributeName });
}

function getVueLiteralAttribute(node, sourceCode, attributeName) {
  if (node.value == null || typeof node.value.value !== "string") {
    return null;
  }

  const wrapper = sourceCode.getText(node.value).at(0) ?? "\"";

  return {
    attributeName,
    node: node.value,
    text: node.value.value,
    replaceText(fixer, nextText) {
      return fixer.replaceText(node.value, quoteText(nextText, wrapper));
    },
  };
}

export function getStaticClassAttribute(node, sourceCode) {
  if (node.type === "JSXAttribute") {
    const attributeName = getAttributeName(node);

    if (attributeName !== "class" && attributeName !== "className") {
      return null;
    }

    if (node.value?.type === "Literal") {
      return getQuotedLiteralAttribute(node, sourceCode, attributeName);
    }

    return getExpressionAttribute(node, sourceCode, attributeName);
  }

  if (node.type === "VAttribute") {
    const attributeName = getVueAttributeName(node);

    if (attributeName !== "class") {
      return null;
    }

    return getVueLiteralAttribute(node, sourceCode, attributeName);
  }

  if (node.type === "Attribute") {
    const attributeName = getAttributeName(node);

    if (attributeName !== "class" && attributeName !== "className") {
      return null;
    }

    if (node.value?.type === "Literal") {
      return getQuotedLiteralAttribute(node, sourceCode, attributeName);
    }
  }

  return null;
}

function isSeparator(character) {
  return /\s/u.test(character);
}

export function parseClassString(text) {
  const tokens = [];
  const separators = [];
  let current = "";
  let separator = "";
  let quote = null;
  let squareDepth = 0;
  let roundDepth = 0;
  let inToken = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const previous = text[index - 1];

    if (!inToken) {
      if (isSeparator(character)) {
        separator += character;
        continue;
      }

      separators.push(separator);
      separator = "";
      inToken = true;
    }

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

    if (squareDepth === 0 && roundDepth === 0 && isSeparator(character)) {
      tokens.push(current);
      current = "";
      separator = character;
      inToken = false;
      continue;
    }

    current += character;
  }

  if (inToken) {
    tokens.push(current);
  }

  separators.push(separator);

  return {
    separators,
    tokens,
  };
}

export function rebuildClassString(parsed, replacements) {
  const normalizedReplacements = new Map(
    replacements.map((replacement) => [replacement.start, replacement]),
  );

  let nextText = parsed.separators[0] ?? "";
  let index = 0;

  while (index < parsed.tokens.length) {
    const replacement = normalizedReplacements.get(index);

    if (replacement) {
      nextText += replacement.tokens.join(" ");
      nextText += parsed.separators[replacement.end + 1] ?? "";
      index = replacement.end + 1;
      continue;
    }

    nextText += parsed.tokens[index];
    nextText += parsed.separators[index + 1] ?? "";
    index += 1;
  }

  return nextText;
}
