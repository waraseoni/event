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
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useSystemSettings } from '@/contexts/system-settings-context'
import { LanguageSwitcher } from './language-switcher'

export function Navbar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { settings } = useSystemSettings()

  // Use system name from settings or fallback
  const systemName = settings?.system_name || 'Events Manager'
  const systemShortName = settings?.system_short_name || 'EMS'
  const logoUrl = settings?.logo_url

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.contacts'), href: '/contacts', icon: Users },
    { name: t('nav.inventory'), href: '/inventory', icon: Package },
    { name: t('nav.pricing'), href: '/pricing', icon: IndianRupee },
    { name: t('nav.events'), href: '/events', icon: CalendarDays },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-18 items-center justify-between py-3">
          {/* Logo with System Name */}
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl shadow-lg">
              {logoUrl ? (
                <img src={logoUrl} alt={systemShortName} className="h-6 w-6 object-contain" />
              ) : (
                <LayoutDashboard className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
              {systemName}
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent sm:hidden">
              {systemShortName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                      : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600 hover:shadow-md'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-indigo-500')} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link 
              href="/settings"
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                pathname === '/settings'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-white/60 hover:text-amber-600'
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('language.hindi') === 'हिंदी' ? 'सेटिंग्स' : 'Settings'}</span>
            </Link>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-300 hover:shadow-md">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/20 bg-white/50 backdrop-blur-lg">
        <div className="flex overflow-x-auto py-2 px-2 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-300 min-w-[70px]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-white/60'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-indigo-500')} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            )
          })}
          {/* Mobile Settings Link */}
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-300 min-w-[70px]',
              pathname === '/settings'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-white/60'
            )}
          >
            <Settings className={cn('h-5 w-5', pathname === '/settings' ? 'text-white' : 'text-amber-500')} />
            <span className="text-[10px]">{t('language.hindi') === 'हिंदी' ? 'सेटिंग्स' : 'Settings'}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
