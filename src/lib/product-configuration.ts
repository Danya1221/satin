export type Configuration = { color: string; memory: string; sim: string };

/** A selected option can be cleared without losing the other choices. */
export function toggleConfiguration(
  current: Configuration,
  key: keyof Configuration,
  value: string,
  positions: Configuration[],
): Configuration {
  const next = { ...current, [key]: current[key] === value ? "" : value };
  if (!next[key]) return next;
  const compatible = positions.some(position =>
    (Object.keys(next) as (keyof Configuration)[]).every(field => !next[field] || position[field] === next[field]),
  );
  if (!compatible) {
    for (const field of ["color", "memory", "sim"] as const) {
      if (field !== key) next[field] = "";
    }
  }
  return next;
}
