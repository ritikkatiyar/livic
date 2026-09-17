import React from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
        <MarketplaceHeader />
        <main className="flex-1">{children}</main>
        <MarketplaceFooter />
      </div>
    </ThemeProvider>
  );
}
