export type CreatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  /** The default block's height. Omit when the property has several blocks. */
  totalFloors?: number;
  amenities?: string[];
  autoBillDayOfMonth?: number | null;
};

export type UpdatePropertyRequest = {
  name: string;
  address: string;
  city: string;
  landmark?: string;
  /** The default block's height. Omit when the property has several blocks. */
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
  ownerId?: string;
  isActive?: boolean;
  amenities?: string[];
  autoBillDayOfMonth?: number | null;
  totalUnits?: number;
  occupiedUnits?: number;
};
