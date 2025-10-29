import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Personalized Speaking Coach',
  description: 'AI-powered public speaking feedback platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
