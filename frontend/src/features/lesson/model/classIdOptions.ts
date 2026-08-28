export function parseClassIds(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function joinClassIds(classIds: string[]): string {
  return classIds.join(', ');
}

export function classIdLikeOptFilter(classId: string): string {
  return `classId:like:${classId}`;
}

export function classIdsFromOptions(options?: Record<string, unknown> | null): string[] {
  return parseClassIds(options?.classId);
}

export function resolveClassNames(
  classIds: string[],
  groups: Array<{ id: string; name: string }>,
): string[] {
  const names = new Map(groups.map((group) => [group.id, group.name]));
  return classIds
    .map((id) => names.get(id))
    .filter((name): name is string => Boolean(name && name.length > 0));
}
