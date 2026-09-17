import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Navigation, ArrowLeft, Building2 } from 'lucide-react';
import { getPropertyDetail, getPropertyUnits, ROOMS_PAGE_SIZE } from '@/api/marketplace';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyAmenities } from '@/components/property/PropertyAmenities';
import { buildRoomsHref, RoomList } from '@/components/property/RoomList';
import { PropertyQrSection } from '@/components/property/PropertyQrSection';
import { PropertyTypeBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parsePage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const res = await getPropertyDetail(resolvedParams.propertyId);
  const property = res.data;

  if (!property) {
    return {
      title: 'Property Not Found | Livic Marketplace',
    };
  }

  return {
    title: `${property.name} in ${property.city} | Livic Marketplace`,
    description:
      property.description ||
      `Explore verified rental rooms and units at ${property.name}, ${property.city}. Zero brokerage, refundable token booking.`,
    openGraph: {
      title: `${property.name} - ${property.city}`,
      description: property.description,
      images: property.coverImageUrl ? [property.coverImageUrl] : [],
    },
  };
}

export default async function PropertyDetailPage({ params, searchParams }: Props) {
  const [resolvedParams, query] = await Promise.all([params, searchParams]);
  const page = parsePage(query.page);
  const availableOnly = query.available === '1';

  const [res, unitsRes] = await Promise.all([
    getPropertyDetail(resolvedParams.propertyId),
    getPropertyUnits(resolvedParams.propertyId, { page, availableOnly }),
  ]);
  const property = res.data;
  const units = unitsRes.data;

  if (!property || !units) {
    notFound();
  }

  // Out-of-range page (e.g. a stale link): send the visitor to the last page instead of an empty list
  if (units.totalPages > 0 && page > units.totalPages) {
    redirect(buildRoomsHref(property.id, units.totalPages, availableOnly));
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${property.name}, ${property.address}`
  )}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Nav */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/market-place"
          className="hover:text-indigo-600 dark:hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Search
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-200">{property.city}</span>
        <span>/</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate">{property.name}</span>
      </div>

      {/* Gallery Section */}
      <PropertyGallery images={property.images} name={property.name} />

      {/* Header Block */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <PropertyTypeBadge type={property.propertyType} />
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> {property.totalFloors} Floors Total
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {property.name}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{property.address}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-4 md:pt-0 md:pl-6 shrink-0 gap-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Starting Rent</span>
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300 tracking-tight">
                {formatCurrency(property.startingPrice, true)}
              </span>
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Navigation className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Get Directions
            </a>
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-1">About this property</h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{property.description}</p>
          </div>
        )}
      </div>

      {/* Amenities Grid */}
      <PropertyAmenities amenities={property.amenities} />

      {/* Room Listing Component */}
      <RoomList
        propertyId={property.id}
        units={units.items}
        page={units.page}
        pageSize={units.pageSize || ROOMS_PAGE_SIZE}
        totalPages={units.totalPages}
        totalItems={units.totalItems}
        totalUnitsCount={property.totalUnitsCount}
        availableUnitsCount={property.availableUnitsCount}
        availableOnly={availableOnly}
      />

      {/* QR Code Section */}
      <PropertyQrSection propertyId={property.id} name={property.name} />
    </div>
  );
}
