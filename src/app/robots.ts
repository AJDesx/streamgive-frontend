import type { MetadataRoute } from 'next';

import { APP_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_URL;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/platform-admin', '/ngo-admin', '/dashboard', '/embed'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
