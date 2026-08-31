import type { MetadataRoute } from 'next';
import { getCarrier } from '@/lib/carrier';

export default function manifest(): MetadataRoute.Manifest {
  const carrier = getCarrier();
  return {
    name: carrier.metaTitle,
    short_name: carrier.siteName,
    description: carrier.metaDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#667eea',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
