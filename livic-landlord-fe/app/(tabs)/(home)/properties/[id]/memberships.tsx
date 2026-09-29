import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import MembershipManagementScreen from '@/src/features/properties/screens/MembershipManagementScreen';

export default function MembershipsRoute() {
  const { id } = useLocalSearchParams();
  
  return (
    <MembershipManagementScreen propertyId={id as string} />
  );
}
