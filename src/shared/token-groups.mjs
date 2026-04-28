export function getContiguousGroups(groupKeys) {
  const groups = [];
  let index = 0;

  while (index < groupKeys.length) {
    const key = groupKeys[index];

    if (key == null) {
      index += 1;
      continue;
    }

    let end = index;

    while (end + 1 < groupKeys.length && groupKeys[end + 1] === key) {
      end += 1;
    }

    groups.push({
      end,
      key,
      start: index,
    });
    index = end + 1;
  }

  return groups;
}

export function getGroupsIgnoringNull(groupKeys) {
  const groups = [];
  let currentGroup = null;

  for (let index = 0; index < groupKeys.length; index += 1) {
    const key = groupKeys[index];

    if (key == null) {
      continue;
    }

    if (currentGroup == null) {
      currentGroup = {
        end: index,
        key,
        start: index,
      };
      continue;
    }

    if (currentGroup.key === key) {
      currentGroup.end = index;
      continue;
    }

    groups.push(currentGroup);
    currentGroup = {
      end: index,
      key,
      start: index,
    };
  }

  if (currentGroup != null) {
    groups.push(currentGroup);
  }

  return groups;
}

export function getGroupsIgnoringUnknown(groupKeys, ignoredFlags) {
  const groups = [];
  let currentGroup = null;

  for (let index = 0; index < groupKeys.length; index += 1) {
    const key = groupKeys[index];

    if (key == null) {
      if (ignoredFlags[index]) {
        continue;
      }

      if (currentGroup != null) {
        groups.push(currentGroup);
        currentGroup = null;
      }

      continue;
    }

    if (currentGroup == null) {
      currentGroup = {
        end: index,
        key,
        start: index,
      };
      continue;
    }

    if (currentGroup.key === key) {
      currentGroup.end = index;
      continue;
    }

    groups.push(currentGroup);
    currentGroup = {
      end: index,
      key,
      start: index,
    };
  }

  if (currentGroup != null) {
    groups.push(currentGroup);
  }

  return groups;
}

export function getKnownSegments(groupKeys) {
  const start = groupKeys.findIndex((key) => key != null);

  if (start === -1) {
    return [];
  }

  const end = groupKeys.findLastIndex((key) => key != null);

  return [
    {
      end,
      start,
    },
  ];
}

export function mergeIgnoredTokens(tokens, groupKeys, nextKnownTokens) {
  const mergedTokens = [];
  let knownTokenIndex = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    if (groupKeys[index] == null) {
      mergedTokens.push(tokens[index]);
      continue;
    }

    mergedTokens.push(nextKnownTokens[knownTokenIndex]);
    knownTokenIndex += 1;
  }

  return mergedTokens;
}
