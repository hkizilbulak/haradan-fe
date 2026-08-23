import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { MY_LISTING_TABS } from '@/services/my-listings';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { MyListingStatus } from '@/types';

type MobileMyListingsTabsProps = {
  active: MyListingStatus;
  counts: Record<MyListingStatus, number>;
  onChange: (key: MyListingStatus) => void;
};

/** İlanlarım — yatay pill durum sekmeleri. */
export const MobileMyListingsTabs = memo(function MobileMyListingsTabs({
  active,
  counts,
  onChange,
}: MobileMyListingsTabsProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');
  const border = useThemeColor('border');
  const bg = useThemeColor('background');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {MY_LISTING_TABS.map((tab) => {
        const on = active === tab.key;
        const count = counts[tab.key];
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={
              count > 0 ? `${tab.label}, ${count} ilan` : tab.label
            }
            style={({ pressed }) => [
              styles.pill,
              on
                ? [styles.pillOn, { backgroundColor: header }]
                : [styles.pillOff, { borderColor: border, backgroundColor: bg }],
              pressed && { opacity: 0.78 },
            ]}
          >
            <Text
              style={[styles.label, { color: on ? '#fff' : text }]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            {count > 0 ? (
              <View
                style={[
                  styles.count,
                  { backgroundColor: on ? 'rgba(255,255,255,0.22)' : border },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: on ? '#fff' : textMuted },
                  ]}
                >
                  {count > 99 ? '99+' : String(count)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
  },
  pillOn: {},
  pillOff: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
