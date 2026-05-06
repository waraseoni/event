'use client'

import { Search, Bell, User as UserIcon, LogOut } from 'lucide-react'
import { LanguageSwitcher } from './language-switcher'
import { useLanguage } from '@/contexts/language-context'

export function Topbar() {
  const { t, language } = useLanguage()

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-16 w-full items-center justify-between bg-white/70 dark:bg-[#000000]/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-8 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder={language === 'en' ? 'Search anything...' : 'कुछ भी खोजें...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-500 dark:text-white"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="dark-mode-override">
          <LanguageSwitcher />
        </div>
        
        <button className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-[#000000]"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 pr-3 rounded-xl transition-all border border-slate-200 dark:border-slate-800">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Admin</span>
          </button>
          
          <button 
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
            title={t('nav.logout')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
