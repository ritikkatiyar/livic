import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import { getUnitDetail } from '@/api/marketplace';
import { RoomConversionContainer } from '@/components/booking/RoomConversionContainer';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ propertyId: string; unitId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const res = await getUnitDetail(resolvedParams.propertyId, resolvedParams.unitId);
  const data = res.data;

  if (!data) {
    return {
      title: 'Room Not Found | Livic Marketplace',
    };
  }

  return {
    title: `Unit ${data.unit.unitNumber} (${data.unit.type}) - ${data.property.name} | Livic Marketplace`,
    description: `Book or schedule a tour for Unit ${data.unit.unitNumber} at ${data.property.name}, ${data.property.city}. ${formatCurrency(data.unit.basePrice, true)}.`,
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const res = await getUnitDetail(resolvedParams.propertyId, resolvedParams.unitId);
  const data = res.data;

  if (!data) {
    notFound();
  }

  const { property, unit } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Nav */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href={`/market-place/${property.id}`}
          className="hover:text-indigo-600 dark:hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {property.name}
        </Link>
        <span>/</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Unit {unit.unitNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Room Overview & Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant={unit.isBookable ? 'success' : 'warning'}>
                {unit.isBookable ? 'Available for Immediate Booking' : 'Currently Occupied'}
              </Badge>

              <span className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {unit.type}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Unit {unit.unitNumber} — {property.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{property.address}</span>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Monthly Rent</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300 tracking-tight">
                  {formatCurrency(unit.basePrice, true)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Max Capacity</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> {unit.capacity} {unit.capacity === 1 ? 'Person' : 'People'}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Room Amenities */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Room Overview</h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {unit.description || 'Fully equipped unit featuring modern furnishings, optimal lighting, and high-speed internet accessibility.'}
            </p>

            {unit.amenities && unit.amenities.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Room Features & Amenities
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {unit.amenities.map((am, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{am}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Livic Guarantee Banner */}
          <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">Verified Property & Flexible Terms</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                All listings on Livic Marketplace undergo physical verification. Token deposits are protected under our instant refund policy.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Lead Conversion Funnel */}
        <div className="lg:col-span-5 sticky top-24">
          <RoomConversionContainer property={property} unit={unit} />
        </div>
      </div>
    </div>
  );
}
