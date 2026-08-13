/**
 * Account tab — oturum yoksa login; varsa ana sayfa (profil çekmeceden yönetilir).
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthSession();
  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/');
      return;
    }
    router.replace('/auth/login');
  }, [isLoggedIn, router]);

  return (
    <View style={[styles.wrap, { backgroundColor: surface }]}>
      <ActivityIndicator color={primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
