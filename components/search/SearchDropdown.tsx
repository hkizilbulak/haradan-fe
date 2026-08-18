import React, { memo, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup } from '@/services/location';
import { formatMoney } from '@/utils/formatMoney';
import type { CatalogProductCard } from '@/types';

export type SearchDropdownProps = {
  results: CatalogProductCard[];
  loading?: boolean;
  query: string;
  isOpen: boolean;
  onSelectAdvert: (advert: CatalogProductCard) => void;
  onViewAll: (query: string) => void;
  onClose?: () => void;
  variant?: 'home' | 'header';
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
};

function SearchDropdownItem({
  advert,
  onPress,
  isHeaderVariant,
}: {
  advert: CatalogProductCard;
  onPress: () => void;
  isHeaderVariant: boolean;
}) {
  const text = useThemeColor(isHeaderVariant ? 'header' : 'text');
  const textSecondary = useThemeColor(
    isHeaderVariant ? 'textSecondary' : 'textSecondary'
  );
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const badgeUrgentBg = '#ef4444';

  const locationText = useMemo(() => {
    const province = advert.provinceId
      ? locationLookup.getProvinceName(advert.provinceId)
      : null;
    const district =
      advert.provinceId && advert.districtId
        ? locationLookup.getDistrictName(advert.districtId)
        : null;

    if (district && province) return `${province}, ${district}`;
    if (province) return province;
    return null;
  }, [advert.provinceId, advert.districtId]);

  const subtitle = [advert.brand, locationText].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={advert.title}
      style={({ pressed }) => [
        styles.itemRow,
        {
          borderBottomColor: border,
          backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : 'transparent',
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition: 'background-color 150ms ease',
            },
            default: {},
          }),
        },
      ]}
    >
      <View style={[styles.thumbWrap, { backgroundColor: 'rgba(0,0,0,0.04)' }]}>
        {advert.cover?.publicUrl ? (
          <Image
            source={{ uri: advert.cover.publicUrl }}
            style={styles.thumbImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={20} color={textMuted} />
          </View>
        )}
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemTitleRow}>
          <Text style={[styles.itemTitle, { color: text }]} numberOfLines={1}>
            {advert.title}
          </Text>
          {advert.isUrgent ? (
            <View
              style={[
                styles.urgentBadge,
                { backgroundColor: badgeUrgentBg },
              ]}
            >
              <Text style={styles.urgentBadgeText}>ACİL</Text>
            </View>
          ) : null}
        </View>

        {subtitle ? (
          <Text
            style={[styles.itemSubtitle, { color: textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.itemPriceRow}>
          <Text style={[styles.itemPrice, { color: textSecondary }]}>
            {formatMoney(advert.price)}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={textMuted}
        style={styles.itemChevron}
      />
    </Pressable>
  );
}

function DropdownSkeletonRow() {
  const border = useThemeColor('border');
  const skeletonBg = useThemeColor('skeleton');

  return (
    <View style={[styles.skeletonRow, { borderBottomColor: border }]}>
      <View style={[styles.skeletonThumb, { backgroundColor: skeletonBg }]} />
      <View style={styles.skeletonContent}>
        <View
          style={[styles.skeletonLineLong, { backgroundColor: skeletonBg }]}
        />
        <View
          style={[styles.skeletonLineShort, { backgroundColor: skeletonBg }]}
        />
      </View>
    </View>
  );
}

export const SearchDropdown = memo(function SearchDropdown({
  results,
  loading = false,
  query,
  isOpen,
  onSelectAdvert,
  onViewAll,
  variant = 'home',
  maxHeight = 380,
  style,
}: SearchDropdownProps) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const headerBg = useThemeColor('header');

  const isHeader = variant === 'header';

  if (!isOpen) return null;

  const hasResults = results.length > 0;
  const showEmpty = !loading && !hasResults && query.trim().length > 0;

  return (
    <View
      nativeID="haradan-search-dropdown"
      style={[
        styles.dropdownContainer,
        {
          backgroundColor: surface,
          borderColor: border,
          maxHeight,
          ...Platform.select({
            web: {
              boxShadow: isHeader
                ? '0 18px 40px -4px rgba(0, 0, 0, 0.16), 0 0 1px 1px rgba(0,0,0,0.06)'
                : '0 20px 48px -6px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(0,0,0,0.04)',
            },
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 20,
              elevation: 8,
            },
          }),
        },
        style,
      ]}
    >
      {/* Header bar */}
      <View style={[styles.dropdownHeader, { borderBottomColor: border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: textMuted }]}>
            {loading
              ? 'Aranıyor…'
              : hasResults
              ? `Eşleşen İlanlar (${results.length})`
              : 'Arama Sonucu'}
          </Text>
        </View>
      </View>

      {/* Content list */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {loading ? (
          <>
            <DropdownSkeletonRow />
            <DropdownSkeletonRow />
            <DropdownSkeletonRow />
          </>
        ) : showEmpty ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: 'rgba(0,0,0,0.03)' },
              ]}
            >
              <Ionicons name="search-outline" size={24} color={textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: text }]}>
              {`"${query}" ile eşleşen ilan bulunamadı`}
            </Text>
            <Text style={[styles.emptyHint, { color: textMuted }]}>
              Farklı bir kelime veya tür deneyebilirsiniz.
            </Text>
            <Pressable
              onPress={() => onViewAll(query)}
              style={({ pressed }) => [
                styles.emptyBrowseBtn,
                {
                  backgroundColor: headerBg,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.emptyBrowseBtnText}>
                Tüm ilanları incele
              </Text>
            </Pressable>
          </View>
        ) : (
          results.map((advert) => (
            <SearchDropdownItem
              key={advert.id}
              advert={advert}
              isHeaderVariant={isHeader}
              onPress={() => onSelectAdvert(advert)}
            />
          ))
        )}
      </ScrollView>

      {/* Footer bar */}
      {hasResults && !loading ? (
        <Pressable
          onPress={() => onViewAll(query)}
          accessibilityRole="button"
          accessibilityLabel="Tüm sonuçları gör"
          style={({ pressed }) => [
            styles.dropdownFooter,
            {
              borderTopColor: border,
              backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : 'transparent',
              ...Platform.select({
                web: {
                  cursor: 'pointer' as const,
                  transition: 'background-color 150ms ease',
                },
                default: {},
              }),
            },
          ]}
        >
          <Text style={[styles.footerText, { color: text }]}>
            Tüm sonuçları gör ({results.length} ilan)
          </Text>
          <Ionicons name="arrow-forward" size={14} color={text} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scrollList: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingVertical: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  urgentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  urgentBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  itemChevron: {
    marginLeft: 4,
    opacity: 0.5,
  },
  dropdownFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyBrowseBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.card,
  },
  emptyBrowseBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skeletonThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLineLong: {
    height: 14,
    borderRadius: 4,
    width: '75%',
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: 4,
    width: '45%',
  },
});
