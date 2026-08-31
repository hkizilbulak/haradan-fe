import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { FavoritesDrawer } from '@/components/layout/FavoritesDrawer';
import { ProfileDrawer } from '@/components/layout/ProfileDrawer';
import type { ProfileDrawerAction } from '@/components/layout/ProfileDrawer';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { SideDrawer } from '@/components/layout/SideDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useFavorites } from '@/hooks/useFavorites';
import { useThemeColor } from '@/hooks/useThemeColor'
import type { AdvertId } from '@/types/advertId';

type DrawerPanel = 'none' | 'profile' | 'favorites' | 'settings';

type HeaderDrawersValue = {
  openProfile: () => void;
  closeProfile: () => void;
  openFavorites: (opts?: { fromProfile?: boolean }) => void;
  closeFavorites: () => void;
  openSettings: (opts?: { fromProfile?: boolean }) => void;
  closeSettings: () => void;
  profileOpen: boolean;
  favoritesOpen: boolean;
  settingsOpen: boolean;
};

const HeaderDrawersContext = createContext<HeaderDrawersValue | null>(null);

export function useHeaderDrawers(): HeaderDrawersValue | null {
  return useContext(HeaderDrawersContext);
}

/** Tüm sayfalarda ortak profil + favori + ayarlar çekmecesi. */
export function HeaderDrawersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, isLoggedIn } = useAuthSession();
  const { logout } = useAuth();
  const { items: favoriteItems, remove } = useFavorites();
  const textMuted = useThemeColor('textMuted');

  const [panel, setPanel] = useState<DrawerPanel>('none');
  const [fromProfile, setFromProfile] = useState(false);
  const lastPanel = useRef<'profile' | 'favorites' | 'settings'>('profile');

  if (panel === 'profile' || panel === 'favorites' || panel === 'settings') {
    lastPanel.current = panel;
  }

  const shown = panel === 'none' ? lastPanel.current : panel;
  const visible = panel !== 'none';

  const openProfile = useCallback(() => {
    if (!isLoggedIn) return;
    setFromProfile(false);
    setPanel('profile');
  }, [isLoggedIn]);

  const closeProfile = useCallback(() => {
    setPanel('none');
    setFromProfile(false);
  }, []);

  const openFavorites = useCallback(
    (opts?: { fromProfile?: boolean }) => {
      if (!isLoggedIn) {
        router.push('/auth/login?next=/favorites');
        return;
      }
      setFromProfile(opts?.fromProfile === true);
      setPanel('favorites');
    },
    [isLoggedIn, router]
  );

  const closeFavorites = useCallback(() => {
    setPanel('none');
    setFromProfile(false);
  }, []);

  const openSettings = useCallback(
    (opts?: { fromProfile?: boolean }) => {
      if (!isLoggedIn) return;
      setFromProfile(opts?.fromProfile === true);
      setPanel('settings');
    },
    [isLoggedIn]
  );

  const closeSettings = useCallback(() => {
    setPanel('none');
    setFromProfile(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && (panel === 'favorites' || panel === 'settings')) {
      setPanel('none');
      setFromProfile(false);
    }
  }, [isLoggedIn, panel]);

  const closeAll = useCallback(() => {
    setPanel('none');
    setFromProfile(false);
  }, []);

  const backToProfile = useCallback(() => {
    if (!isLoggedIn) return;
    setFromProfile(false);
    setPanel('profile');
  }, [isLoggedIn]);

  const onLogout = useCallback(() => {
    void logout(session?.accessToken ?? null);
    closeAll();
  }, [logout, session?.accessToken, closeAll]);

  const onNavigate = useCallback(
    (action: ProfileDrawerAction) => {
      if (action === 'favorites') {
        openFavorites({ fromProfile: true });
        return;
      }
      if (action === 'settings') {
        openSettings({ fromProfile: true });
        return;
      }
      if (action === 'listings') {
        closeAll();
        router.push('/my-listings');
        return;
      }
      closeAll();
    },
    [openFavorites, openSettings, closeAll, router]
  );

  const onFavoriteItemPress = useCallback(
    (id: AdvertId) => {
      closeAll();
      router.push(`/advert/${id}`);
    },
    [closeAll, router]
  );

  const drawerTitle = useMemo(() => {
    if (shown === 'profile') return 'Profil';
    if (shown === 'favorites') return 'Favoriler';
    return 'Ayarlar';
  }, [shown]);

  const drawerKicker = useMemo(() => {
    if (shown === 'profile') return 'Hesap';
    if (shown === 'favorites') return 'Kayıtlı';
    return 'Hesap';
  }, [shown]);

  const drawerA11y = useMemo(() => {
    if (shown === 'profile') return 'Profil menüsü';
    if (shown === 'favorites') return 'Favori ilanlar';
    return 'Hesap ayarları';
  }, [shown]);

  const value = useMemo(
    () => ({
      openProfile,
      closeProfile,
      openFavorites,
      closeFavorites,
      openSettings,
      closeSettings,
      profileOpen: panel === 'profile',
      favoritesOpen: panel === 'favorites',
      settingsOpen: panel === 'settings',
    }),
    [openProfile, closeProfile, openFavorites, closeFavorites, openSettings, closeSettings, panel]
  );

  const showBackButton =
    (shown === 'favorites' || shown === 'settings') && isLoggedIn;

  return (
    <HeaderDrawersContext.Provider value={value}>
      {children}
      <SideDrawer
        visible={visible}
        onClose={closeAll}
        onBack={showBackButton ? backToProfile : undefined}
        backLabel={fromProfile ? 'Geri' : 'Profile git'}
        kicker={drawerKicker}
        title={drawerTitle}
        accessibilityLabel={drawerA11y}
        meta={
          shown === 'favorites' ? (
            <Text style={{ fontSize: 13, fontWeight: '500', color: textMuted }}>
              {favoriteItems.length}
            </Text>
          ) : null
        }
      >
        {shown === 'profile' ? (
          <ProfileDrawer
            user={session?.user ?? null}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        ) : shown === 'favorites' ? (
          <FavoritesDrawer
            items={favoriteItems}
            onItemPress={onFavoriteItemPress}
            onRemove={remove}
          />
        ) : (
          <SettingsDrawer user={session?.user ?? null} />
        )}
      </SideDrawer>
    </HeaderDrawersContext.Provider>
  );
}
