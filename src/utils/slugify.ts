export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || 'provider';
  let candidate = root;
  let counter = 1;

  while (await exists(candidate)) {
    candidate = `${root}-${counter}`;
    counter += 1;
  }

  return candidate;
}
