import fs from "node:fs";
import path from "node:path";

export const DEFAULT_THEME_FILE_CANDIDATES = [
  "app/globals.css",
  "src/app/globals.css",
  "src/index.css",
  "src/main.css",
  "src/styles.css",
  "src/assets/main.css",
  "styles/globals.css",
  "app.css",
  "index.css",
];

const themeCache = new Map();

function normalizeSettings(context, options) {
  const settings = context.settings?.tailwindcssCondense ?? {};

  return {
    autoDiscoverThemeFiles:
      settings.autoDiscoverThemeFiles ??
      options.autoDiscoverThemeFiles ??
      true,
    cwd: path.resolve(settings.cwd ?? options.cwd ?? process.cwd()),
    themeFiles: settings.themeFiles ?? options.themeFiles ?? null,
  };
}

function isRelativeImport(importPath) {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

function resolveInitialThemeFiles({ autoDiscoverThemeFiles, cwd, themeFiles }) {
  if (Array.isArray(themeFiles) && themeFiles.length > 0) {
    return themeFiles.map((themeFile) => path.resolve(cwd, themeFile));
  }

  if (!autoDiscoverThemeFiles) {
    return [];
  }

  return DEFAULT_THEME_FILE_CANDIDATES
    .map((candidate) => path.resolve(cwd, candidate))
    .filter((candidate) => fs.existsSync(candidate));
}

function getFileSignature(filePaths) {
  return filePaths
    .map((filePath) => {
      try {
        const stats = fs.statSync(filePath);

        return `${filePath}:${stats.mtimeMs}:${stats.size}`;
      } catch {
        return `${filePath}:missing`;
      }
    })
    .join("|");
}

function stripCssComments(css) {
  return css.replaceAll(/\/\*[\s\S]*?\*\//gu, "");
}

function findMatchingBrace(css, startIndex) {
  let quote = null;
  let depth = 0;

  for (let index = startIndex; index < css.length; index += 1) {
    const character = css[index];
    const previous = css[index - 1];

    if (quote != null) {
      if (character === quote && previous !== "\\") {
        quote = null;
      }

      continue;
    }

    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function extractThemeBlocks(css) {
  const blocks = [];
  let searchIndex = 0;

  while (searchIndex < css.length) {
    const themeIndex = css.indexOf("@theme", searchIndex);

    if (themeIndex === -1) {
      break;
    }

    const openBraceIndex = css.indexOf("{", themeIndex);

    if (openBraceIndex === -1) {
      break;
    }

    const closeBraceIndex = findMatchingBrace(css, openBraceIndex);

    if (closeBraceIndex === -1) {
      break;
    }

    blocks.push(css.slice(openBraceIndex + 1, closeBraceIndex));
    searchIndex = closeBraceIndex + 1;
  }

  return blocks;
}

function addThemeToken(theme, tokenName) {
  theme.tokens.add(tokenName);

  const namespaceMatch = /^--([a-z0-9-]+?)-(.+)$/iu.exec(tokenName);

  if (namespaceMatch == null) {
    return;
  }

  const [, namespace, value] = namespaceMatch;
  const values = theme.namespaces.get(namespace) ?? new Set();

  values.add(value);
  theme.namespaces.set(namespace, values);
}

function collectThemeTokens(css, theme) {
  const cleanCss = stripCssComments(css);

  for (const block of extractThemeBlocks(cleanCss)) {
    for (const match of block.matchAll(/(--[a-z0-9-_]+)\s*:/giu)) {
      addThemeToken(theme, match[1]);
    }
  }
}

function collectImports(css) {
  const imports = [];
  const cleanCss = stripCssComments(css);

  for (const match of cleanCss.matchAll(/@import\s+(?:url\()?["']([^"')]+)["']\)?/giu)) {
    const importPath = match[1];

    if (isRelativeImport(importPath)) {
      imports.push(importPath);
    }
  }

  return imports;
}

function readThemeFile(filePath, theme, visited) {
  const resolvedFilePath = path.resolve(filePath);

  if (visited.has(resolvedFilePath) || !fs.existsSync(resolvedFilePath)) {
    return;
  }

  visited.add(resolvedFilePath);

  const css = fs.readFileSync(resolvedFilePath, "utf8");
  const directory = path.dirname(resolvedFilePath);

  collectThemeTokens(css, theme);

  for (const importPath of collectImports(css)) {
    readThemeFile(path.resolve(directory, importPath), theme, visited);
  }
}

function createEmptyTheme() {
  return {
    namespaces: new Map(),
    tokens: new Set(),
  };
}

export function getTheme(context, options = {}) {
  const settings = normalizeSettings(context, options);
  const initialThemeFiles = resolveInitialThemeFiles(settings);
  const cacheKey = [
    settings.cwd,
    settings.autoDiscoverThemeFiles ? "auto" : "manual",
    initialThemeFiles.join(","),
    getFileSignature(initialThemeFiles),
  ].join("|");

  if (themeCache.has(cacheKey)) {
    return themeCache.get(cacheKey);
  }

  const theme = createEmptyTheme();
  const visited = new Set();

  for (const themeFile of initialThemeFiles) {
    readThemeFile(themeFile, theme, visited);
  }

  themeCache.set(cacheKey, theme);

  return theme;
}

export function hasThemeValue(theme, namespace, value) {
  return theme.namespaces.get(namespace)?.has(value) ?? false;
}
