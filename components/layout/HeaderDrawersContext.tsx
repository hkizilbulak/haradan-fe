import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { FavoritesDrawer } from '@/components/layout/FavoritesDrawer';
import { ProfileDrawer } from '@/components/layout/ProfileDrawer';
import type { ProfileDrawerAction } from '@/components/layout/ProfileDrawer';
import { SideDrawer } from '@/components/layout/SideDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useFavorites } from '@/hooks/useFavorites';
import { useThemeColor } from '@/hooks/useThemeColor';

type DrawerPanel = 'none' | 'profile' | 'favorites';

type HeaderDrawersValue = {
  openProfile: () => void;
  closeProfile: () => void;
  openFavorites: (opts?: { fromProfile?: boolean }) => void;
  closeFavorites: () => void;
  profileOpen: boolean;
  favoritesOpen: boolean;
};

const HeaderDrawersContext = createContext<HeaderDrawersValue | null>(null);

export function useHeaderDrawers(): HeaderDrawersValue | null {
  return useContext(HeaderDrawersContext);
}

/** Tüm sayfalarda ortak profil + favori çekmecesi. */
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
  const lastPanel = useRef<'profile' | 'favorites'>('profile');

  if (panel === 'profile' || panel === 'favorites') {
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

  const openFavorites = useCallback((opts?: { fromProfile?: boolean }) => {
    setFromProfile(opts?.fromProfile === true);
    setPanel('favorites');
  }, []);

  const closeFavorites = useCallback(() => {
    setPanel('none');
    setFromProfile(false);
  }, []);

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
    void logout(session?.refreshToken ?? null);
    closeAll();
  }, [logout, session?.refreshToken, closeAll]);

  const onNavigate = useCallback(
    (action: ProfileDrawerAction) => {
      if (action === 'favorites') {
        openFavorites({ fromProfile: true });
        return;
      }
      if (action === 'listings') {
        closeAll();
        router.push('/my-listings');
        return;
      }
      closeAll();
    },
    [openFavorites, closeAll, router]
  );

  const onFavoriteItemPress = useCallback(
    (id: string) => {
      closeAll();
      router.push(`/advert/${id}`);
    },
    [closeAll, router]
  );

  const value = useMemo(
    () => ({
      openProfile,
      closeProfile,
      openFavorites,
      closeFavorites,
      profileOpen: panel === 'profile',
      favoritesOpen: panel === 'favorites',
    }),
    [openProfile, closeProfile, openFavorites, closeFavorites, panel]
  );

  return (
    <HeaderDrawersContext.Provider value={value}>
      {children}
      <SideDrawer
        visible={visible}
        onClose={closeAll}
        onBack={
          shown === 'favorites' && isLoggedIn ? backToProfile : undefined
        }
        backLabel={fromProfile ? 'Geri' : 'Profile git'}
        kicker={shown === 'profile' ? 'Hesap' : 'Kayıtlı'}
        title={shown === 'profile' ? 'Profil' : 'Favoriler'}
        accessibilityLabel={
          shown === 'profile' ? 'Profil menüsü' : 'Favori ilanlar'
        }
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
        ) : (
          <FavoritesDrawer
            items={favoriteItems}
            onItemPress={onFavoriteItemPress}
            onRemove={remove}
          />
        )}
      </SideDrawer>
    </HeaderDrawersContext.Provider>
  );
}
