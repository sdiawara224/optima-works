import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const url = process.env.SITE_URL;
  return {
    rules: {
      userAgent: '*',
      ...(process.env.SITE_INDEXABLE === 'true'
        ? { allow: '/', disallow: ['/api/'] }
        : { disallow: '/' }),
    },
    ...(url ? { sitemap: `${url}/sitemap.xml` } : {}),
  };
}
