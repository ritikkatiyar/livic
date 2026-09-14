import { PropertyDetail, PropertySearchFilters, PropertySummary } from '@/types/property';
import { UnitSummary } from '@/types/unit';

export const MOCK_PROPERTIES: PropertyDetail[] = [
  {
    id: 'prop-101',
    name: 'Livic Horizon Luxury Residence',
    city: 'Bengaluru',
    landmark: 'Near Sony World Signal, Koramangala',
    propertyType: 'RENTAL',
    coverImageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 18500,
    address: '100 Feet Road, 4th Block Koramangala, Bengaluru, Karnataka 560034',
    totalFloors: 5,
    description: 'Modern luxury studio and 1 BHK residences designed for tech professionals and modern urban living. Features high-speed fiber internet, full power backup, 24/7 biometric security, and dedicated workspace pods.',
    amenities: [
      'High-Speed Wi-Fi',
      'Power Backup 24/7',
      'Biometric Security',
      'Daily Housekeeping',
      'Washing Machine & Dryer',
      'Gym & Wellness Corner',
      'Covered Parking',
      'EV Charging Point',
    ],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    units: [
      {
        id: 'unit-201',
        unitNumber: '201',
        type: '1 BHK',
        capacity: 2,
        basePrice: 24000,
        isBookable: true,
        description: 'Spacious 1 BHK with private balcony, king-sized bed, fully loaded kitchenette, and ergonomic work desk.',
        amenities: ['Private Balcony', 'AC', 'Kitchenette', 'Smart TV', 'Ergonomic Desk'],
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        ],
      },
      {
        id: 'unit-202',
        unitNumber: '202',
        type: 'Studio Apartment',
        capacity: 1,
        basePrice: 18500,
        isBookable: true,
        description: 'Cozy studio apartment with smart space layout, attached bathroom, mini fridge, and high-speed Wi-Fi router.',
        amenities: ['AC', 'Mini Fridge', 'Smart Lock', 'Study Table'],
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        ],
      },
      {
        id: 'unit-301',
        unitNumber: '301',
        type: '2 BHK',
        capacity: 4,
        basePrice: 38000,
        isBookable: false,
        description: 'Premium 2 BHK suite featuring dual master bedrooms, spacious living hall, and full Modular Kitchen.',
        amenities: ['Dual AC', 'Modular Kitchen', 'Washing Machine', 'Balcony'],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        ],
      },
    ],
  },
  {
    id: 'prop-102',
    name: 'Livic Stays Co-living Hostel',
    city: 'Bengaluru',
    landmark: 'Opposite Indiranagar Metro Station',
    propertyType: 'HOSTEL',
    coverImageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 9500,
    address: '100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
    totalFloors: 4,
    description: 'Vibrant co-living hostel with community dining, gaming lounge, rooftop cinema, and study spaces. Perfect for students and working young professionals.',
    amenities: [
      '3 Meals Daily Included',
      'High-Speed Wi-Fi',
      'Gaming Lounge',
      'Rooftop Terrace',
      'Laundry Service',
      '24/7 Security & CCTV',
    ],
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    ],
    units: [
      {
        id: 'unit-h1',
        unitNumber: 'H-101',
        type: 'Single Unit',
        capacity: 1,
        basePrice: 15500,
        isBookable: true,
        description: 'Private single room with attached washroom, wardrobe, personal study area, and air conditioning.',
        amenities: ['Attached Bath', 'AC', 'Personal Lockers', 'Study Desk'],
      },
      {
        id: 'unit-h2',
        unitNumber: 'H-102',
        type: 'Shared Unit',
        capacity: 2,
        basePrice: 9500,
        isBookable: true,
        description: 'Twin-sharing air-conditioned room with individual beds, personal wardrobes, and dedicated study tables.',
        amenities: ['Individual Wardrobe', 'Shared Bath', 'AC', 'Personal Lamp'],
      },
    ],
  },
  {
    id: 'prop-103',
    name: 'Grand Bay Residential Society',
    city: 'Mumbai',
    landmark: 'Hiranandani Gardens, Powai',
    propertyType: 'SOCIETY',
    coverImageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 42000,
    address: 'Central Avenue, Powai, Mumbai, Maharashtra 400076',
    totalFloors: 18,
    description: 'Gated premium residential society with swimming pool, clubhouse, tennis court, landscaped gardens, and multi-tier security.',
    amenities: [
      'Swimming Pool',
      'Clubhouse & Gym',
      'Tennis & Badminton Court',
      'Kid Play Area',
      '24/7 Security',
      'Covered Parking',
    ],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ],
    units: [
      {
        id: 'unit-gb1',
        unitNumber: 'Flat 1204',
        type: '2 BHK',
        capacity: 4,
        basePrice: 42000,
        isBookable: true,
        description: 'East-facing 2 BHK flat overlooking Powai Lake. Modern modular kitchen and balcony.',
        amenities: ['Lake View', 'Modular Kitchen', 'Power Backup', 'Parking Slot'],
      },
    ],
  },
  {
    id: 'prop-104',
    name: 'CyberCity Smart Apartments',
    city: 'Gurugram',
    landmark: 'Near DLF Cyber City Phase 2',
    propertyType: 'RENTAL',
    coverImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    startingPrice: 22000,
    address: 'DLF Phase 2, MG Road, Gurugram, Haryana 122002',
    totalFloors: 8,
    description: 'Fully furnished serviced apartments featuring smart home automation, high-speed Wi-Fi, daily housekeeping, and concierge service.',
    amenities: ['Smart Automation', 'Daily Housekeeping', 'Power Backup', 'Gym', 'High Speed Internet'],
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    ],
    units: [
      {
        id: 'unit-cc1',
        unitNumber: 'Suite 405',
        type: '1 BHK',
        capacity: 2,
 basePrice: 22000,
        isBookable: true,
        description: 'Smart 1 BHK suite with keyless entry, smart TV, and work station.',
        amenities: ['Keyless Entry', 'Smart TV', 'AC', 'Workstation'],
      },
    ],
  },
];

export async function mockSearchProperties(
  filters: PropertySearchFilters
): Promise<PropertySummary[]> {
  // Simulate 150ms network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  return MOCK_PROPERTIES.filter((prop) => {
    if (filters.city && !prop.city.toLowerCase().includes(filters.city.toLowerCase()) && !prop.landmark?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.propertyType && filters.propertyType.length > 0) {
      if (!filters.propertyType.includes(prop.propertyType)) {
        return false;
      }
    }
    if (filters.minPrice !== undefined && prop.startingPrice && prop.startingPrice < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && prop.startingPrice && prop.startingPrice > filters.maxPrice) {
      return false;
    }
    return true;
  }).map((prop) => ({
    id: prop.id,
    name: prop.name,
    city: prop.city,
    landmark: prop.landmark,
    propertyType: prop.propertyType,
    coverImageUrl: prop.coverImageUrl,
    startingPrice: prop.startingPrice,
  }));
}

export async function mockGetPropertyDetail(propertyId: string): Promise<PropertyDetail | null> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const found = MOCK_PROPERTIES.find((p) => p.id === propertyId);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function mockGetUnitDetail(
  propertyId: string,
  unitId: string
): Promise<{ property: PropertyDetail; unit: UnitSummary } | null> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const prop = MOCK_PROPERTIES.find((p) => p.id === propertyId);
  if (!prop) return null;
  const unit = prop.units.find((u) => u.id === unitId);
  if (!unit) return null;
  return {
    property: JSON.parse(JSON.stringify(prop)),
    unit: JSON.parse(JSON.stringify(unit)),
  };
}
