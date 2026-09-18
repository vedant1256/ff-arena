import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VPS EsportsHub',
    short_name: 'VPS Esports',
    description: 'Professional Esports Tournament Arena',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0e14',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icons/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
