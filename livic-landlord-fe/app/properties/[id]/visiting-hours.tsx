import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import VisitingHoursScreen from '@/src/features/leases/screens/VisitingHoursScreen';

export default function VisitingHoursRoute() {
  const { id } = useLocalSearchParams();

  return <VisitingHoursScreen propertyId={id as string} />;
}
