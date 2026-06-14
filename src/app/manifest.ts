import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CUniq Go 月神卡选号神器',
    short_name: 'CUniq Go',
    description: 'CUniq月神卡选号神器，HK$9/月持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选。',
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
