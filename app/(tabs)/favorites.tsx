/**
 * Favoriler sekmesi — login zorunlu; liste BE /v1/me/favorites.
 */
import React, { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui';
import { FavoriteListCard } from '@/components/product/FavoriteListCard';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useFavorites } from '@/hooks/useFavorites';
import { MOBILE_HOME_DOCK_INSET } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';

export default function FavoritesScreen() {
  const router = useRouter();
  const isWide = useIsWideLayout();
  const { isLoggedIn } = useAuthSession();
  const { items, hydrating, remove, requireLogin } = useFavorites();

  useEffect(() => {
    if (!isLoggedIn) requireLogin();
  }, [isLoggedIn, requireLogin]);

  const onPress = useCallback(
    (id: string) => router.push(`/advert/${id}`),
    [router]
  );

  if (!isLoggedIn) {
    return (
      <ScreenWrapper
        isLoading={false}
        isError={false}
        isEmpty
        emptyVariant="favorite"
        emptyTitle="Favoriler için giriş yapın"
        emptyDescription="Beğendiğiniz ilanları kaydetmek için hesabınıza giriş yapın."
        emptyActionLabel="Giriş yap"
        onEmptyAction={requireLogin}
      >
        {null}
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      isLoading={hydrating && items.length === 0}
      isError={false}
      isEmpty={!hydrating && items.length === 0}
      loadingVariant="cards"
      loadingCount={3}
      emptyVariant="favorite"
      emptyTitle="Favori listeniz boş"
      emptyDescription="Beğendiğiniz ilanların kalbine dokunun, buraya ekleyin."
      emptyActionLabel="İlanlara Göz At"
      onEmptyAction={() => router.push('/')}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          !isWide && { paddingBottom: MOBILE_HOME_DOCK_INSET },
        ]}
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
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, gap: Spacing.md },
  row: { marginBottom: Spacing.sm },
});
