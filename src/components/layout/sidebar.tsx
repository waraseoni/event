'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  IndianRupee,
  CalendarDays,
  BarChart3,
  LogOut,
  Settings,
  Menu,
  X,
  User,
  Truck,
  Receipt,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useSystemSettings } from '@/contexts/system-settings-context'
import { LanguageSwitcher } from './language-switcher'
import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useCurrentUser } from '@/contexts/user-context'
import type { UserRole } from '@/types'

/**
 * `roles` gates an entry in the nav. Omitted means everyone. This only hides
 * the link - every action behind it is re-checked server-side, and Row Level
 * Security is the real boundary.
 */
type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  roles?: UserRole[]
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const { settings } = useSystemSettings()
  const { role } = useCurrentUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const systemName = settings?.system_name || 'Events Manager'
  const systemShortName = settings?.system_short_name || 'EMS'
  const logoUrl = settings?.logo_url

  const navigation: NavItem[] = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.contacts'), href: '/contacts', icon: Users },
    { name: t('nav.clients'), href: '/clients', icon: User },
    { name: t('nav.inventory'), href: '/inventory', icon: Package },
    { name: t('nav.pricing'), href: '/pricing', icon: IndianRupee },
    { name: t('nav.events'), href: '/events', icon: CalendarDays },
    { name: t('nav.rentals'), href: '/rentals', icon: Truck },
    { name: t('nav.staff'), href: '/staff', icon: Users },
    { name: t('nav.billing'), href: '/billing', icon: Receipt },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
    { name: t('nav.users'), href: '/users', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ]

  // role is null until the profile loads, which hides gated items rather than
  // flashing them at the wrong person.
  const visibleNavigation = navigation.filter(
    (item) => !item.roles || (role !== null && item.roles.includes(role))
  )

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabaseBrowser.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 dark:bg-[#000000] sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={systemShortName} className="h-6 w-6 object-contain" />
          ) : (
            <LayoutDashboard className="h-6 w-6 text-white" />
          )}
          <span className="text-lg font-bold text-white tracking-tight">{systemShortName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="text-slate-300 hover:text-white transition-colors"><LanguageSwitcher /></div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 dark:bg-[#000000] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-md">
              {logoUrl ? (
                <img src={logoUrl} alt={systemShortName} className="h-5 w-5 object-contain filter brightness-0 invert" />
              ) : (
                <LayoutDashboard className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="text-lg font-bold text-white tracking-tight truncate">{systemName}</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {visibleNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href} className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}>
                <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3 md:hidden">
          <button onClick={handleLogout} disabled={loggingOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all">
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button onClick={handleLogout} disabled={loggingOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all">
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />}
    </>
  )
}
