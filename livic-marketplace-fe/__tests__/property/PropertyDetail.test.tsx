import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RoomList } from '@/components/property/RoomList';
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

  it('renders available room cards correctly', () => {
    render(<RoomList propertyId="prop-1" units={mockUnits} />);
    expect(screen.getByText(/Unit 101/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Now/i)).toBeInTheDocument();
    expect(screen.getByText('View & Book')).toBeInTheDocument();
  });

  it('returns null when units array is empty', () => {
    const { container } = render(<RoomList propertyId="prop-1" units={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
