/**
 * Favoriler sayfası — boş durum ağırlıklı örnek
 */
import React from 'react';
import { ScreenWrapper } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useRouter } from 'expo-router';

async function fetchFavorites(): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 800));
  return []; // Favori yok — EmptyState gösterilir
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { isLoading, isError, isEmpty, error, refetch } =
    useAsync(fetchFavorites, { isEmpty: (d) => d.length === 0 });

  return (
    <ScreenWrapper
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      loadingVariant="cards"
      loadingCount={3}
      errorVariant="generic"
      errorMessage={error}
      onRetry={refetch}
      emptyVariant="favorite"
      emptyTitle="Favori listeniz boş"
      emptyDescription="Beğendiğiniz ilanların kalbine dokunun, buraya ekleyin."
      emptyActionLabel="İlanlara Göz At"
      onEmptyAction={() => router.push('/')}
    >
      {null}
    </ScreenWrapper>
  );
}
