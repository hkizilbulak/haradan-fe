/**
 * Favoriler sekmesi — login zorunlu; liste BE /v1/me/favorites.
 */
import React, { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
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

export default function FavoritesScreen() {
  const router = useRouter();
  const isWide = useIsWideLayout();
  const safeInsets = useSafeInsets();
  const dockPad = mobileDockScrollInset(safeInsets.bottom);
  const { isLoggedIn } = useAuthSession();
  const { items, hydrating, remove, requireLogin } = useFavorites();

  useEffect(() => {
    if (!isLoggedIn) requireLogin();
  }, [isLoggedIn, requireLogin]);

  const onPress = useCallback(
    (id: string) => router.push(`/advert/${id}`),
    [router]
  );

  const listPad = !isWide ? dockPad : Spacing.lg;

  if (!isLoggedIn) {
    return (
      <View style={styles.root}>
        {!isWide ? (
          <MobileScreenHeader title="Favorilerim" subtitle="Giriş gerekli" />
        ) : null}
        <ScreenWrapper
          edges={isWide ? undefined : ['left', 'right']}
          contentInsetBottom={!isWide ? dockPad : 0}
          isLoading={false}
          isError={false}
          isEmpty
          emptyVariant="favorite"
          emptyTitle="Favoriler için giriş yapın"
          emptyDescription="Beğendiğiniz ilanları kaydetmek için hesabınıza giriş yapın."
          emptyActionLabel="Giriş yap"
          onEmptyAction={requireLogin}
          style={styles.flex}
        >
          {null}
        </ScreenWrapper>
      </View>
    );
  }

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
          keyExtractor={(item) => item.id}
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
  list: { padding: Spacing.md, gap: Spacing.md },
  row: { marginBottom: Spacing.sm },
});
