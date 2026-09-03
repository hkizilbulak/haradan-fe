import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MobileScreenHeader } from '@/components/layout/mobile/MobileScreenHeader';
import { ScreenWrapper } from '@/components/ui';
import { FavoriteListCard } from '@/components/product/FavoriteListCard';
import { mobileDockScrollInset } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertId } from '@/types/advertId';

export default function FavoritesScreen() {
  const router = useRouter();
  const isWide = useIsWideLayout();
  const safeInsets = useSafeInsets();
  const dockPad = mobileDockScrollInset(safeInsets.bottom);
  const primary = useThemeColor('primary');
  const { isLoggedIn, ready } = useAuthSession();
  const { items, hydrating, remove } = useFavorites();

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.replace('/auth/login?next=/favorites');
    }
  }, [ready, isLoggedIn, router]);

  const onPress = useCallback(
    (id: AdvertId) => router.push(`/advert/${id}`),
    [router]
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.redirect}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  const listPad = !isWide ? dockPad : Spacing.lg;

  return (
    <View style={styles.root}>
      {!isWide ? (
        <MobileScreenHeader
          title="Favorilerim"
          subtitle={
            hydrating
              ? 'Yükleniyor…'
              : items.length > 0
                ? `${items.length} ilan`
                : 'Listeniz boş'
          }
        />
      ) : null}

      <ScreenWrapper
        edges={isWide ? undefined : ['left', 'right']}
        contentInsetBottom={!isWide ? dockPad : 0}
        scrollable={false}
        isLoading={hydrating && items.length === 0}
        isError={false}
        isEmpty={!hydrating && items.length === 0}
        loadingVariant="cards"
        loadingCount={3}
        emptyVariant="favorite"
        emptyTitle="Favori listeniz boş"
        emptyDescription="Beğendiğiniz ilanların kalbine dokunun, buraya ekleyin."
        emptyActionLabel="İlanlara Göz At"
        onEmptyAction={() => router.push('/listings')}
        style={styles.flex}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: listPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <FavoriteListCard
                product={item}
                onPress={onPress}
                onRemove={remove}
              />
            </View>
          )}
        />
      </ScreenWrapper>
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
  list: { padding: Spacing.md, gap: Spacing.md },
  row: { marginBottom: Spacing.sm },
});
