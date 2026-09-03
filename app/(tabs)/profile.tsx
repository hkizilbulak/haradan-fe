/**
 * Hesabım sekmesi — mobilde profil menüsü; geniş ekranda çekmeceye yönlendirir.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MobileScreenHeader } from '@/components/layout/mobile/MobileScreenHeader';
import {
  ProfileDrawer,
  type ProfileDrawerAction,
} from '@/components/layout/ProfileDrawer';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { mobileDockScrollInset } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';

type MobilePanel = 'menu' | 'settings';

export default function ProfileScreen() {
  const router = useRouter();
  const isWide = useIsWideLayout();
  const safeInsets = useSafeInsets();
  const dockPad = mobileDockScrollInset(safeInsets.bottom);
  const primary = useThemeColor('primary');
  const textMuted = useThemeColor('textMuted');
  const { session, isLoggedIn, ready } = useAuthSession();
  const { logout } = useAuth();
  const [panel, setPanel] = useState<MobilePanel>('menu');

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.replace('/auth/login?next=/profile');
      return;
    }
    if (ready && isWide) {
      router.replace('/');
    }
  }, [ready, isWide, isLoggedIn, router]);

  const onLogout = useCallback(() => {
    void logout(session?.accessToken ?? null);
    setPanel('menu');
  }, [logout, session?.accessToken]);

  const onNavigate = useCallback(
    (action: ProfileDrawerAction) => {
      if (action === 'favorites') {
        router.push('/(tabs)/favorites');
        return;
      }
      if (action === 'settings') {
        setPanel('settings');
        return;
      }
      if (action === 'listings') {
        router.push('/my-listings');
      }
    },
    [router]
  );

  if (isWide || !isLoggedIn) {
    return (
      <View style={styles.redirect}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  const user = session?.user ?? null;
  const subtitle =
    panel === 'settings'
      ? 'Hesap ayarları'
      : user?.email ?? undefined;

  return (
    <View style={styles.root}>
      <MobileScreenHeader
        title={panel === 'settings' ? 'Ayarlar' : 'Hesabım'}
        subtitle={subtitle}
        right={
          panel === 'settings' ? (
            <Pressable
              onPress={() => setPanel('menu')}
              accessibilityRole="button"
              accessibilityLabel="Profile dön"
              hitSlop={8}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="chevron-back" size={22} color={textMuted} />
            </Pressable>
          ) : null
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: dockPad }]}
      >
        {panel === 'settings' ? (
          <SettingsDrawer user={user} />
        ) : (
          <ProfileDrawer
            user={user}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  redirect: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
