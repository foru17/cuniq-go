import { MetadataRoute } from 'next';
import { getCarrier } from '@/lib/carrier';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getCarrier().siteUrl;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}?type=ordinary`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}?type=special`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
  ];
}
