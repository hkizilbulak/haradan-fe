import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedListingCard } from '@/components/product/FeaturedListingCard';
import { MobileScreenHeader } from '@/components/layout/mobile/MobileScreenHeader';
import { DraftDeleteConfirm } from './DraftDeleteConfirm';
import { MyListingsTabs } from './MyListingsTabs';
import { MobileMyListingsTabs } from './mobile/MobileMyListingsTabs';
import { HomeContentContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import {
  HOME_CONTENT_MAX_WIDTH,
  homeContentPadding,
  mobileDockScrollInset,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useMyListings } from '@/hooks/useMyListings';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertId } from '@/types/advertId';
import { prepareListingWizardEntry } from '@/services/listing';
import { locationLookup } from '@/services/location';
import { MY_LISTING_TABS } from '@/services/my-listings';
import { ApiError } from '@/services/http';
import type { MyListingCard, MyListingStatus } from '@/types';

const EMPTY: Record<MyListingStatus, { title: string; hint: string }> = {
  published: {
    title: 'Yayında ilan yok',
    hint: 'Yeni bir ilan vererek burada görünün.',
  },
  pending: {
    title: 'İncelemede ilan yok',
    hint: 'Moderasyona gönderilen ilanlarınız burada listelenir.',
  },
  rejected: {
    title: 'Reddedilen ilan yok',
    hint: 'Reddedilen ilanlarınız bu sekmede görünür.',
  },
  draft: {
    title: 'Taslak yok',
    hint: 'Yarım kalan veya düzeltme bekleyen ilanlarınız burada durur.',
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
  const isWide = useIsWideLayout();
  const safeInsets = useSafeInsets();
  const dockPad = mobileDockScrollInset(safeInsets.bottom);
  const primary = useThemeColor('primary');
  const [status, setStatus] = useState<MyListingStatus>('published');
  const published = useMyListings('published', accessToken);
  const pending = useMyListings('pending', accessToken);
  const rejected = useMyListings('rejected', accessToken);
  const drafts = useMyListings('draft', accessToken);
  const sold = useMyListings('sold', accessToken);
  const { apply, remember, toggle } = useFavorites();
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const errorColor = useThemeColor('error');
  const [pendingDelete, setPendingDelete] = useState<MyListingCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletingRef = useRef(false);

  const [markingSoldId, setMarkingSoldId] = useState<AdvertId | null>(null);
  const [soldError, setSoldError] = useState<string | null>(null);
  const markingSoldRef = useRef(false);

  const byTab = useMemo(
    () => ({
      published: apply(published.items),
      pending: apply(pending.items),
      rejected: apply(rejected.items),
      draft: apply(drafts.items),
      sold: apply(sold.items),
    }),
    [
      apply,
      published.items,
      pending.items,
      rejected.items,
      drafts.items,
      sold.items,
    ]
  );

  const queries = {
    published,
    pending,
    rejected,
    draft: drafts,
    sold,
  } as const;

  const activeItems = byTab[status];
  const active = queries[status];

  const counts = useMemo(
    () => ({
      published: published.items.length,
      pending: pending.items.length,
      rejected: rejected.items.length,
      draft: drafts.items.length,
      sold: sold.items.length,
    }),
    [
      published.items.length,
      pending.items.length,
      rejected.items.length,
      drafts.items.length,
      sold.items.length,
    ]
  );

  const cols = isWide ? 3 : 2;
  const gap = isWide ? Spacing.lg : Spacing.sm;
  const pad = isWide ? homeContentPadding(isWide) : Spacing.md;
  const contentWidth = isWide
    ? Math.min(width, HOME_CONTENT_MAX_WIDTH)
    : width;
  const colWidth = Math.floor(
    (contentWidth - pad * 2 - gap * (cols - 1)) / cols
  );

  const [locationTick, setLocationTick] = useState(0);
  const allItems = useMemo(
    () => [
      ...byTab.published,
      ...byTab.pending,
      ...byTab.rejected,
      ...byTab.draft,
      ...byTab.sold,
    ],
    [byTab]
  );

  useEffect(() => {
    remember(allItems);
  }, [remember, allItems]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const provinces = await locationLookup.listProvinces();
        const needed = new Set(
          allItems.map((i) => i.provinceId).filter(Boolean)
        );
        await Promise.all(
          provinces
            .filter((p) => needed.has(p.id))
            .map((p) => locationLookup.listDistricts(p.id))
        );
        if (!cancelled) setLocationTick((n) => n + 1);
      } catch {
        /* konum isimleri opsiyonel */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allItems]);

  const postAd = () => {
    prepareListingWizardEntry();
    router.push('/post');
  };

  const requestRemoveItem = useCallback(
    (id: AdvertId) => {
      const item = activeItems.find((entry) => entry.id === id);
      if (!item) return;
      setDeleteError(null);
      setPendingDelete(item);
    },
    [activeItems]
  );

  const cancelRemoveDraft = useCallback(() => {
    if (deletingRef.current) return;
    setPendingDelete(null);
  }, []);

  const confirmRemoveItem = useCallback(async () => {
    if (!pendingDelete || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await active.removeDraft(pendingDelete.id, pendingDelete.version);
      setPendingDelete(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'İlan silinemedi.');
      setPendingDelete(null);
      if (err instanceof ApiError && err.code === 'STALE_VERSION') {
        void active.refetch({ silent: true });
      }
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }, [active, pendingDelete]);

  const requestMarkSold = useCallback(
    (id: AdvertId) => {
      if (markingSoldRef.current) return;
      const item = activeItems.find((entry) => entry.id === id);
      if (!item) return;
      setSoldError(null);
      void confirmMarkSold(id, item.version);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeItems]
  );

  const confirmMarkSold = useCallback(
    async (id: AdvertId, version: number) => {
      if (markingSoldRef.current) return;
      markingSoldRef.current = true;
      setMarkingSoldId(id);
      try {
        await published.markSold(id, version);
        setSoldError(null);
      } catch (err) {
        setSoldError(err instanceof Error ? err.message : 'İlan güncellenemedi.');
        if (err instanceof ApiError && err.code === 'STALE_VERSION') {
          void published.refetch({ silent: true });
        }
      } finally {
        markingSoldRef.current = false;
        setMarkingSoldId(null);
      }
    },
    [published]
  );

  const showPostCta = status === 'published' || status === 'draft';

  const activeTabLabel =
    MY_LISTING_TABS.find((tab) => tab.key === status)?.label ?? 'İlanlar';

  const mobileSubtitle = active.loading
    ? 'Yükleniyor…'
    : active.error
      ? 'Yüklenemedi'
      : activeItems.length > 0
        ? `${activeItems.length} ilan · ${activeTabLabel}`
        : activeTabLabel;

  const listingCards = activeItems.map((item) => (
    <FeaturedListingCard
      key={`${item.id}-${locationTick}`}
      product={item}
      width={colWidth}
      compact={!isWide}
      badge={item.isUrgent && item.status !== 'sold' ? 'urgent' : 'auto'}
      onPress={(id) => router.push(`/advert/${id}`)}
      onToggleFavorite={toggle}
      onRemove={status === 'draft' ? requestRemoveItem : undefined}
      removing={deleting && pendingDelete?.id === item.id}
      onMarkSold={status === 'published' ? requestMarkSold : undefined}
      markingSold={markingSoldId === item.id}
      accessToken={accessToken}
    />
  ));

  const statusErrors = (
    <>
      {deleteError ? (
        <Text style={[styles.deleteError, { color: errorColor }]}>
          {deleteError}
        </Text>
      ) : null}
      {soldError ? (
        <Text style={[styles.deleteError, { color: errorColor }]}>
          {soldError}
        </Text>
      ) : null}
    </>
  );

  const listBody = active.loading ? (
    <View style={styles.center}>
      <ActivityIndicator color={primary} />
    </View>
  ) : active.error ? (
    <View style={styles.mobileError}>
      <Text style={[styles.error, { color: text }]}>{active.error}</Text>
      <Pressable
        onPress={() => void active.refetch()}
        accessibilityRole="button"
        accessibilityLabel="Yeniden dene"
        style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.retryText, { color: primary }]}>Yeniden dene</Text>
      </Pressable>
    </View>
  ) : activeItems.length === 0 ? (
    <View style={styles.mobileEmpty}>
      <View style={[styles.emptyIcon, { backgroundColor: surface }]}>
        <Ionicons name="layers-outline" size={24} color={muted} />
      </View>
      <Text style={[styles.emptyTitle, { color: text }]}>
        {EMPTY[status].title}
      </Text>
      <Text style={[styles.emptyHint, { color: muted }]}>
        {EMPTY[status].hint}
      </Text>
      {showPostCta ? (
        <Button onPress={postAd} variant="primary" size="md">
          İlan Ver
        </Button>
      ) : null}
    </View>
  ) : (
    <View style={[styles.grid, { gap }]}>{listingCards}</View>
  );

  if (!isWide) {
    return (
      <>
        <View style={styles.flex}>
          <MobileScreenHeader
            title="İlanlarım"
            subtitle={mobileSubtitle}
            onBack={() => router.back()}
            right={
              <Pressable
                onPress={postAd}
                accessibilityRole="button"
                accessibilityLabel="Yeni ilan ver"
                style={({ pressed }) => [
                  styles.postFab,
                  { backgroundColor: primary },
                  pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
                ]}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </Pressable>
            }
          />
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.mobileScroll,
              { paddingBottom: dockPad },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <MobileMyListingsTabs
              active={status}
              counts={counts}
              onChange={(next) => {
                setDeleteError(null);
                setSoldError(null);
                setStatus(next);
              }}
            />
            {statusErrors}
            {listBody}
          </ScrollView>
        </View>
        <DraftDeleteConfirm
          visible={pendingDelete != null}
          title={pendingDelete?.title ?? ''}
          loading={deleting}
          onCancel={cancelRemoveDraft}
          onConfirm={() => {
            void confirmRemoveItem();
          }}
        />
      </>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <HomeContentContainer>
          <View
            style={[
              styles.headerRow,
              isWide ? styles.headerRowWide : styles.headerRowMobile,
            ]}
          >
            <View style={styles.headerTextGroup}>
              <Text style={[styles.kicker, { color: muted }]}>Hesap</Text>
              <Text style={[styles.title, { color: text }]}>İlanlarım</Text>
              <Text style={[styles.lead, { color: muted }]}>
                Yayındaki, incelemedeki, reddedilen, taslak ve satılmış ilanlarınız.
              </Text>
            </View>
            <View style={styles.headerBtnWrapper}>
              <Button onPress={postAd} variant="primary" size="md">
                + Yeni İlan Ver
              </Button>
            </View>
          </View>

          <MyListingsTabs
            active={status}
            counts={counts}
            onChange={(next) => {
              setDeleteError(null);
              setSoldError(null);
              setStatus(next);
            }}
          />

          <View style={{ height: Spacing.lg }} />

          {statusErrors}

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
              {showPostCta ? <Button onPress={postAd}>İlan Ver</Button> : null}
            </View>
          ) : (
            <View style={[styles.grid, { gap }]}>{listingCards}</View>
          )}
        </HomeContentContainer>
      </ScrollView>
      <DraftDeleteConfirm
        visible={pendingDelete != null}
        title={pendingDelete?.title ?? ''}
        loading={deleting}
        onCancel={cancelRemoveDraft}
        onConfirm={() => {
          void confirmRemoveItem();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
  mobileScroll: {
    paddingHorizontal: Spacing.md,
  },
  postFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mobileError: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerRow: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerBtnWrapper: {
    paddingBottom: Spacing.xs,
  },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2, marginTop: 4 },
  lead: { ...Typography.body, marginBottom: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  center: { paddingVertical: 64, alignItems: 'center' },
  error: { ...Typography.body, paddingVertical: Spacing.lg },
  deleteError: {
    ...Typography.small,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
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
