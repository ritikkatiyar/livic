import { CheckCircle2 } from 'lucide-react';

export function PropertyAmenities({ amenities }: { amenities: string[] }) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Included Amenities</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {amenities.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm hover:border-indigo-500/50 transition-all"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
