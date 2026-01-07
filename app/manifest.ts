// app/manifest.ts

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Modaltech',
        short_name: 'Modaltech',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/icon_modaltech.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon_modaltech.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
