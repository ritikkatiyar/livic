import { DoorOpen } from 'lucide-react';
import { UnitSummary } from '@/types/unit';
import { RoomCard } from './RoomCard';

export function RoomList({ propertyId, units }: { propertyId: string; units: UnitSummary[] }) {
  if (!units || units.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6" id="available-rooms-section">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Available Rooms & Units ({units.length})
        </h3>
        <span className="text-xs text-slate-600 dark:text-slate-400">Direct booking & instant slot requests</span>
      </div>

      <div className="space-y-4">
        {units.map((unit) => (
          <RoomCard key={unit.id} propertyId={propertyId} unit={unit} />
        ))}
      </div>
    </div>
  );
}
