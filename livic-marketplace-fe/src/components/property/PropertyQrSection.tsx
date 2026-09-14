'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2 } from 'lucide-react';

export function PropertyQrSection({ propertyId }: { propertyId: string; name?: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/market-place/${propertyId}`
      : `https://livic.app/market-place/${propertyId}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
        <Share2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <span>Share Property Page</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-100 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
          <QRCodeSVG value={shareUrl} size={110} level="M" />
        </div>

        <div className="space-y-3 text-center sm:text-left flex-1">
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider block">
              Property QR Code
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Scan with any mobile camera to open this micro-site directly on phone.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            id="copy-property-link-btn"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>Copy Deep Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
