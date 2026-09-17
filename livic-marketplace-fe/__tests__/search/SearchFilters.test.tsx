import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PropertyGrid } from '@/components/search/PropertyGrid';
import { PropertySummary } from '@/types/property';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/market-place',
  useSearchParams: () => new URLSearchParams(),
}));

describe('PropertyGrid Component', () => {
  const mockProperties: PropertySummary[] = [
    {
      id: 'prop-1',
      name: 'Test Apartment',
      city: 'Bengaluru',
      landmark: 'Indiranagar',
      propertyType: 'RENTAL',
      startingPrice: 15000,
    },
  ];

  it('renders property cards correctly', () => {
    render(<PropertyGrid properties={mockProperties} loading={false} error={null} />);
    expect(screen.getByText('Test Apartment')).toBeInTheDocument();
    expect(screen.getByText(/Indiranagar, Bengaluru/i)).toBeInTheDocument();
  });

  it('renders skeleton loading state when loading is true', () => {
    const { container } = render(<PropertyGrid properties={[]} loading={true} error={null} />);
    expect(container.querySelector('#property-grid-loading')).toBeInTheDocument();
  });

  it('renders empty state when no properties found', () => {
    render(<PropertyGrid properties={[]} loading={false} error={null} />);
    expect(screen.getByText('No properties match your filters')).toBeInTheDocument();
  });
});
