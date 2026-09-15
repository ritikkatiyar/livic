import { PagedResult } from '@/types/api';
import { ExistingTourRequest, MyTourRequest, RazorpayOrderPayload } from '@/types/lead';
import { PropertyDetail, PropertySummary, PropertyType } from '@/types/property';
import { UnitSummary } from '@/types/unit';

/**
 * Wire formats returned by the Livic backend (/api/v1/marketplace/**), mapped onto the UI types.
 */

type BackendPage<T> = {
  content: T[];
  number: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
};

type BackendPropertySummary = {
  id: string;
  name: string;
  address: string;
  city: string;
  landmark?: string | null;
  propertyType: PropertyType;
  description?: string | null;
  amenities?: string[];
  images?: string[];
  startingPrice?: string | null; // formatted, e.g. "₹15,000/mo" or "Price on Request"
  totalUnitsCount?: number;
};

type BackendPropertyDetail = BackendPropertySummary & {
  totalFloors?: number | null;
  qrSlug?: string | null;
  availableUnitsCount?: number;
};

type BackendUnit = UnitSummary & { propertyId?: string };

type BackendTokenPayment = {
  leadId: string;
  transactionId: string;
  razorpayOrderId: string;
  amount: number; // rupees
  currency: string;
  keyId: string;
};

function parseFormattedPrice(value?: string | null): number | undefined {
  if (!value) return undefined;
  const digits = value.replace(/[^0-9.]/g, '');
  const parsed = digits ? Number(digits) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function toPropertySummaries(data: BackendPage<BackendPropertySummary> | BackendPropertySummary[] | null): PropertySummary[] {
  const items = Array.isArray(data) ? data : data?.content ?? [];
  return items.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    landmark: p.landmark ?? undefined,
    propertyType: p.propertyType,
    coverImageUrl: p.images?.[0],
    startingPrice: parseFormattedPrice(p.startingPrice),
  }));
}

function toUnit(u: BackendUnit): UnitSummary {
  return {
    ...u,
    basePrice: Number(u.basePrice ?? 0),
    description: u.description ?? undefined,
    amenities: u.amenities ?? [],
    images: u.images ?? [],
  };
}

export function toPropertyDetail(p: BackendPropertyDetail | null): PropertyDetail | null {
  if (!p) return null;
  const images = p.images ?? [];
  return {
    id: p.id,
    name: p.name,
    city: p.city,
    landmark: p.landmark ?? undefined,
    propertyType: p.propertyType,
    coverImageUrl: images[0],
    startingPrice: parseFormattedPrice(p.startingPrice),
    address: p.address,
    totalFloors: p.totalFloors ?? 0,
    description: p.description ?? undefined,
    amenities: p.amenities ?? [],
    images,
    totalUnitsCount: p.totalUnitsCount ?? 0,
    availableUnitsCount: p.availableUnitsCount ?? 0,
  };
}

export function toUnitPage(data: BackendPage<BackendUnit> | null): PagedResult<UnitSummary> {
  if (!data) {
    return { items: [], page: 1, pageSize: 0, totalItems: 0, totalPages: 0 };
  }
  return {
    items: data.content.map(toUnit),
    page: data.number + 1,
    pageSize: data.size,
    totalItems: data.totalElements,
    totalPages: data.totalPages,
  };
}

export function toUnitDetail(
  data: { property: BackendPropertySummary; unit: BackendUnit } | null
): { property: PropertyDetail; unit: UnitSummary } | null {
  if (!data) return null;
  const property = toPropertyDetail(data.property);
  return property ? { property, unit: toUnit(data.unit) } : null;
}

type BackendMyTourRequest = MyTourRequest;

export function toMyTourRequestPage(data: BackendPage<BackendMyTourRequest> | null): PagedResult<MyTourRequest> {
  if (!data) {
    return { items: [], page: 1, pageSize: 0, totalItems: 0, totalPages: 0 };
  }
  return {
    items: data.content.map((r) => ({
      ...r,
      propertyName: r.propertyName ?? null,
      propertyAddress: r.propertyAddress ?? null,
      propertyCity: r.propertyCity ?? null,
      unitNumber: r.unitNumber ?? null,
      decisionNote: r.decisionNote ?? null,
      decidedAt: r.decidedAt ?? null,
      cancellable: Boolean(r.cancellable),
    })),
    page: data.number + 1,
    pageSize: data.size,
    totalItems: data.totalElements,
    totalPages: data.totalPages,
  };
}

/** Reads the blocking request from a duplicate-tour 409 body; null if the body doesn't carry one. */
export function toExistingTourRequest(errorBody: unknown): ExistingTourRequest | null {
  if (!errorBody || typeof errorBody !== 'object') return null;
  const existing = (errorBody as { existingRequest?: Partial<ExistingTourRequest> | null }).existingRequest;
  if (!existing || !existing.leadId || !existing.preferredSlot || !existing.status) return null;
  return {
    leadId: existing.leadId,
    unitId: existing.unitId ?? '',
    unitNumber: existing.unitNumber ?? null,
    status: existing.status,
    preferredSlot: existing.preferredSlot,
  };
}

export function toRazorpayOrder(data: BackendTokenPayment): RazorpayOrderPayload {
  return {
    orderId: data.razorpayOrderId,
    amount: Math.round(Number(data.amount) * 100), // Razorpay expects paise
    currency: data.currency,
    keyId: data.keyId,
  };
}
