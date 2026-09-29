import { Redirect, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import AnnouncementAdminScreen from '@/src/features/announcements/screens/AnnouncementAdminScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function AnnouncementsRoute() {
  const router = useRouter();
  const { isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <AnnouncementAdminScreen
      onLogout={() => {
        Alert.alert(
          'Confirm Logout',
          'Are you sure you want to log out from Livic?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Log Out', 
              style: 'destructive', 
              onPress: async () => {
                await signOut();
                router.replace('/login');
              } 
            }
          ]
        );
      }}
    />
  );
}
