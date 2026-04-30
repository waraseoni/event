import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Events Management System',
  description: 'Complete event management solution for inventory, contacts, and bookings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hi">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
