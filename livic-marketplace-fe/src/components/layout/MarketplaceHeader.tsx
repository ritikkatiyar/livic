'use client';

import Link from 'next/link';
import { Building2, ClipboardList, Search, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';

export function MarketplaceHeader() {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link
          href="/market-place"
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
          id="header-brand-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-400 dark:from-white dark:via-slate-200 dark:to-indigo-300 bg-clip-text text-transparent">
              LIVIC
            </span>
            <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Marketplace
            </span>
          </div>
        </Link>

        {/* Quick Nav Links & Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/market-place"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            id="header-explore-link"
          >
            <Search className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            Explore Properties
          </Link>

          <Link
            href="/market-place/my-requests"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            id="header-my-requests-link"
          >
            <ClipboardList className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">My Requests</span>
            <span className="sr-only sm:hidden">My Requests</span>
          </Link>

          <div className="hidden xs:flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Zero Brokerage</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
