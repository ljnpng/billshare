import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BillShare',
  description: 'Smart bill splitting for meals, taxes, and tips - ensuring everyone pays their fair share',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
