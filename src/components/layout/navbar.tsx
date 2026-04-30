'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  IndianRupee,
  CalendarDays,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { LanguageSwitcher } from './language-switcher'

export function Navbar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.contacts'), href: '/contacts', icon: Users },
    { name: t('nav.inventory'), href: '/inventory', icon: Package },
    { name: t('nav.pricing'), href: '/pricing', icon: IndianRupee },
    { name: t('nav.events'), href: '/events', icon: CalendarDays },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
  ]

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">
              Events Manager
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="flex overflow-x-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium whitespace-nowrap',
                  pathname === item.href
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
