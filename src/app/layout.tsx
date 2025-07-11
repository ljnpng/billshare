import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AAP费用分摊',
  description: '智能分摊餐费、税费和小费，让每个人都支付合理的份额',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
} 