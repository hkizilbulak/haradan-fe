/**
 * İlanlar sayfası — LoadingState / EmptyState / ErrorState örneği
 *
 * Gerçek API bağlandığında yalnızca `fetchListings` fonksiyonunu değiştirin;
 * ScreenWrapper tüm durumları otomatik yönetir.
 */
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';

// ── Tip ──────────────────────────────────────────────────────────────────────
interface ListingItem {
  id: string;
  title: string;
  price: number;
  location: string;
}

// ── Sahte API (gerçek API entegrasyonuna kadar) ───────────────────────────────
async function fetchListings(): Promise<ListingItem[]> {
  await new Promise((r) => setTimeout(r, 1400));

  // Durumu test etmek için bu satırı değiştirin:
  // throw new Error('Ağ bağlantısı kesildi');
  // return [];

  return [
    { id: '1', title: 'Safkan Arap Kısrak', price: 280_000, location: 'İstanbul' },
    { id: '2', title: 'İngiliz Doru Aygır', price: 450_000, location: 'Ankara' },
    { id: '3', title: 'Haflinger Kısrak 7 Yaş', price: 95_000, location: 'Bursa' },
  ];
}

// ── Kart bileşeni ─────────────────────────────────────────────────────────────
function ListingCard({ item }: { item: ListingItem }) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
      <Text style={[styles.cardTitle, { color: text }]}>{item.title}</Text>
      <Text style={[styles.cardLocation, { color: textSecondary }]}>
        📍 {item.location}
      </Text>
      <Text style={[styles.cardPrice, { color: primary }]}>
        ₺{item.price.toLocaleString('tr-TR')}
      </Text>
    </View>
  );
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────
export default function ListingsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, isEmpty, error, refetch } =
    useAsync(fetchListings, {
      isEmpty: (d) => d.length === 0,
    });

  return (
    <ScreenWrapper
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      loadingVariant="cards"
      loadingCount={4}
      // --- error ---
      errorVariant="network"
      errorMessage={error}
      onRetry={refetch}
      // --- empty ---
      emptyVariant="listing"
      emptyTitle="Henüz ilan yok"
      emptyDescription="Şu an gösterilecek ilan bulunamadı. Daha sonra tekrar kontrol edin."
      emptyActionLabel="Yenile"
      onEmptyAction={refetch}
      scrollable={false}
    >
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard item={item} />}
        contentContainerStyle={styles.list}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardLocation: {
    fontSize: 13,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
});
