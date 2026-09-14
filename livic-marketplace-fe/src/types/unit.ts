export type UnitType = 'Single Unit' | 'Shared Unit' | '1 BHK' | '2 BHK' | 'Studio Apartment';

export type UnitSummary = {
  id: string;
  unitNumber: string;
  type: UnitType;
  capacity: number;
  basePrice: number; // Display-only numeric representation of base price
  isBookable: boolean;
  images?: string[];
  description?: string;
  amenities?: string[];
};
