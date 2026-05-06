import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
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
          <div className="flex h-screen flex-col md:flex-row bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col bg-background overflow-hidden">
              <Topbar />
              <div className="flex-1 overflow-y-auto container mx-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl custom-scrollbar">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
