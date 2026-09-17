export type PropertyType = 'RENTAL' | 'HOSTEL' | 'SOCIETY' | 'MESS' | 'INDIVIDUAL';

export type PropertySummary = {
  id: string;
  name: string;
  city: string;
  landmark?: string;
  propertyType: PropertyType;
  coverImageUrl?: string;
  startingPrice?: number; // Minimum basePrice across bookable units
};

export type PropertyDetail = PropertySummary & {
  address: string;
  totalFloors: number;
  description?: string;
  amenities: string[];
  images: string[];
  totalUnitsCount: number;
  availableUnitsCount: number;
};

export type PropertySearchFilters = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType[];
  availableFrom?: string;
};
