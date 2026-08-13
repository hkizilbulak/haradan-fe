import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedListingCard } from '@/components/product/FeaturedListingCard';
import { MyListingsTabs } from './MyListingsTabs';
import { HomeContentContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import {
  HOME_CONTENT_MAX_WIDTH,
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFavorites } from '@/hooks/useFavorites';
import { useMyListings } from '@/hooks/useMyListings';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';
import type { MyListingStatus } from '@/types';

const EMPTY: Record<MyListingStatus, { title: string; hint: string }> = {
  published: {
    title: 'Yayında ilan yok',
    hint: 'Yeni bir ilan vererek burada görünün.',
  },
  draft: {
    title: 'Taslak yok',
    hint: 'Yarım kalan ilanlarınız burada durur.',
  },
  sold: {
    title: 'Satılmış ilan yok',
    hint: 'Satışı tamamlanan ilanlar bu sekmede listelenir.',
  },
};

type MyListingsViewProps = {
  accessToken: string;
};

export function MyListingsView({ accessToken }: MyListingsViewProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const [status, setStatus] = useState<MyListingStatus>('published');
  const published = useMyListings('published', accessToken);
  const drafts = useMyListings('draft', accessToken);
  const sold = useMyListings('sold', accessToken);
  const { apply, remember, toggle } = useFavorites();
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const publishedItems = useMemo(
    () => apply(published.items),
    [apply, published.items]
  );
  const draftItems = useMemo(() => apply(drafts.items), [apply, drafts.items]);
  const soldItems = useMemo(() => apply(sold.items), [apply, sold.items]);

  const activeItems =
    status === 'published'
      ? publishedItems
      : status === 'draft'
        ? draftItems
        : soldItems;
  const active =
    status === 'published' ? published : status === 'draft' ? drafts : sold;

  const counts = useMemo(
    () => ({
      published: published.items.length,
      draft: drafts.items.length,
      sold: sold.items.length,
    }),
    [published.items.length, drafts.items.length, sold.items.length]
  );

  const cols = isWide ? 3 : width >= 640 ? 2 : 1;
  const gap = isWide ? Spacing.lg : Spacing.md;
  const pad = homeContentPadding(isWide);
  const colWidth = Math.floor(
    (Math.min(width, HOME_CONTENT_MAX_WIDTH) - pad * 2 - gap * (cols - 1)) / cols
  );

  useEffect(() => {
    remember([...publishedItems, ...draftItems, ...soldItems]);
  }, [remember, publishedItems, draftItems, soldItems]);

  const postAd = () => {
    prepareListingWizardEntry();
    router.push('/post');
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <HomeContentContainer>
        <Text style={[styles.kicker, { color: muted }]}>Hesap</Text>
        <Text style={[styles.title, { color: text }]}>İlanlarım</Text>
        <Text style={[styles.lead, { color: muted }]}>
          Yayındaki, taslak ve satılmış ilanlarınız.
        </Text>

        <MyListingsTabs active={status} counts={counts} onChange={setStatus} />

        <View style={{ height: Spacing.lg }} />

        {active.loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : active.error ? (
          <Text style={[styles.error, { color: text }]}>{active.error}</Text>
        ) : activeItems.length === 0 ? (
          <View
            style={[
              styles.empty,
              { borderColor: border, backgroundColor: surface },
            ]}
          >
            <Ionicons name="grid-outline" size={28} color={muted} />
            <Text style={[styles.emptyTitle, { color: text }]}>
              {EMPTY[status].title}
            </Text>
            <Text style={[styles.emptyHint, { color: muted }]}>
              {EMPTY[status].hint}
            </Text>
            {status !== 'sold' ? (
              <Button onPress={postAd}>İlan Ver</Button>
            ) : null}
          </View>
        ) : (
          <View style={[styles.grid, { gap }]}>
            {activeItems.map((item) => (
              <FeaturedListingCard
                key={item.id}
                product={item}
                width={colWidth}
                badge={item.isUrgent && item.status !== 'sold' ? 'urgent' : 'auto'}
                onPress={(id) => router.push(`/advert/${id}`)}
                onToggleFavorite={toggle}
              />
            ))}
          </View>
        )}
      </HomeContentContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2, marginTop: 4 },
  lead: { ...Typography.body, marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  center: { paddingVertical: 64, alignItems: 'center' },
  error: { ...Typography.body, paddingVertical: Spacing.lg },
  empty: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyHint: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
