/** Slugs SEO type « villa-piscine-hammamet-123 ». */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

export function buildPropertySlug(title: string, city: string, uniqueSuffix: string): string {
  return `${slugify(`${title} ${city}`)}-${uniqueSuffix}`;
}
