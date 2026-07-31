/* ID generation and slug utilities */

let counter = 0;

export function generateId(prefix = ''): string {
  counter++;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${ts}${rand}${counter}` : `${ts}${rand}${counter}`;
}

export function slugify(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 60);
}

/** Convert a prose-based flag string to a clean slug key */
export function flagToKey(flag: string): string {
  const s = slugify(flag);
  return s?.length > 0 ? s : `flag_${generateId()}`;
}
