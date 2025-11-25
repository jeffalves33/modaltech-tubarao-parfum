import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PWARegister } from '@/components/pwa-register'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Modaltech - Tubarão Parfum',
  description: 'Sistema completo de gestão de vendas de perfumes',
  generator: 'Modaltech',
  manifest: '/manifest.webmanifest',
  themeColor: '#ffffff',
  icons: {
    icon: [
      {
        url: '/icon_modaltech.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon_modaltech.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon_modaltech_simbolo.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon_modaltech.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <PWARegister />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
