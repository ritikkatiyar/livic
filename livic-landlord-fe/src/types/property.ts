export type CreatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
  amenities?: string[];
  autoBillDayOfMonth?: number | null;
};

export type UpdatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
  amenities?: string[];
  autoBillDayOfMonth?: number | null;
};

export type PropertyResponse = {
  id: string;
  name: string;
  address: string;
  city: string;
  landmark?: string;
  totalFloors?: number;
  ownerId?: string;
  isActive?: boolean;
  amenities?: string[];
  autoBillDayOfMonth?: number | null;
  totalUnits?: number;
  occupiedUnits?: number;
};
