/** Shared by doc-page heading ids and search-result anchor links — keep in sync by using only this. */
export function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
