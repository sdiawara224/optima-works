import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.SITE_URL;
  if (!url || process.env.SITE_INDEXABLE !== 'true') return [];
  const { articles } = await getContent();
  return [
    { url, priority: 1 },
    { url: `${url}/blog`, priority: 0.7 },
    ...articles.map((a) => ({
      url: `${url}/blog/${a.slug}`,
      lastModified: a.publishedAt,
      priority: 0.6,
    })),
  ];
}
