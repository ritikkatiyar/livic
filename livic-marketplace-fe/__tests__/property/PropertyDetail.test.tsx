import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { buildRoomsHref, RoomList } from '@/components/property/RoomList';
import { UnitSummary } from '@/types/unit';

describe('RoomList Component', () => {
  const mockUnits: UnitSummary[] = [
    {
      id: 'unit-1',
      unitNumber: '101',
      type: '1 BHK',
      capacity: 2,
      basePrice: 20000,
      isBookable: true,
      description: 'Cozy 1 BHK flat',
    },
  ];

  const baseProps = {
    propertyId: 'prop-1',
    units: mockUnits,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 1,
    totalUnitsCount: 1,
    availableUnitsCount: 1,
    availableOnly: false,
  };

  it('renders available room cards correctly', () => {
    render(<RoomList {...baseProps} />);
    expect(screen.getByText(/Unit 101/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Now/i)).toBeInTheDocument();
    expect(screen.getByText('View & Book')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Rooms pagination' })).not.toBeInTheDocument();
  });

  it('returns null when the property has no units', () => {
    const { container } = render(<RoomList {...baseProps} units={[]} totalItems={0} totalPages={0} totalUnitsCount={0} availableUnitsCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the range and pagination for a middle page', () => {
    render(<RoomList {...baseProps} page={2} totalPages={10} totalItems={100} totalUnitsCount={100} availableUnitsCount={20} />);
    expect(screen.getByText('Showing 11–20 of 100 rooms')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Rooms pagination' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('href', '/market-place/prop-1?page=3#available-rooms-section');
    expect(screen.getByRole('link', { name: /Available only \(20\)/ })).toHaveAttribute(
      'href',
      '/market-place/prop-1?available=1#available-rooms-section'
    );
  });

  it('shows an empty state when no rooms are available', () => {
    render(<RoomList {...baseProps} units={[]} totalItems={0} totalPages={0} availableUnitsCount={0} availableOnly />);
    expect(screen.getByText('No rooms available right now')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all rooms' })).toHaveAttribute('href', '/market-place/prop-1#available-rooms-section');
  });

  it('builds room list links that keep the availability filter', () => {
    expect(buildRoomsHref('prop-1', 1, false)).toBe('/market-place/prop-1#available-rooms-section');
    expect(buildRoomsHref('prop-1', 4, true)).toBe('/market-place/prop-1?page=4&available=1#available-rooms-section');
  });
});
