import Link from 'next/link';
import { Building2, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export function MarketplaceFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">LIVIC Marketplace</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Verified rental spaces, hostels, and residences across India. Transparent pricing, zero brokerage, and instant tour booking.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Explore Cities
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/market-place?city=Bengaluru" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Properties in Bengaluru
                </Link>
              </li>
              <li>
                <Link href="/market-place?city=Mumbai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Properties in Mumbai
                </Link>
              </li>
              <li>
                <Link href="/market-place?city=Gurugram" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Properties in Gurugram
                </Link>
              </li>
              <li>
                <Link href="/market-place?city=Pune" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Properties in Pune
                </Link>
              </li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Property Types
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/market-place?type=RENTAL" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Apartments & Rentals
                </Link>
              </li>
              <li>
                <Link href="/market-place?type=HOSTEL" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Hostels & Co-living
                </Link>
              </li>
              <li>
                <Link href="/market-place?type=SOCIETY" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Gated Societies
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Livic Trust
            </h3>
            <div className="flex items-start gap-2.5 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>100% Verified Properties & Owners</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <HeartHandshake className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>Refundable Token Booking Guarantee</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <PhoneCall className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <span>24/7 Prospect Support (+91 800-LIVIC-STAY)</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Livic Tech Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-800 dark:hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-400 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
