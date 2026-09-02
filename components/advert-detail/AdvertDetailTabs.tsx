import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertDetailTab } from '@/types';

type Tab = { key: AdvertDetailTab; label: string };

type AdvertDetailTabsProps = {
  tabs: Tab[];
  active: AdvertDetailTab;
  onChange: (key: AdvertDetailTab) => void;
  ratingSlot?: React.ReactNode;
  variant?: 'default' | 'mobile';
};

export const AdvertDetailTabs = memo(function AdvertDetailTabs({
  tabs,
  active,
  onChange,
  ratingSlot,
  variant = 'default',
}: AdvertDetailTabsProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const isMobile = variant === 'mobile';

  const tabRow = tabs.map((tab) => {
    const isActive = tab.key === active;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onChange(tab.key)}
        style={[styles.tab, isMobile && styles.tabMobile]}
      >
        <Text
          style={[
            styles.label,
            isMobile && styles.labelMobile,
            { color: isActive ? text : textMuted, fontWeight: isActive ? '700' : '500' },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
        <View
          style={[
            styles.underline,
            isMobile && styles.underlineMobile,
            { backgroundColor: isActive ? header : 'transparent' },
          ]}
        />
      </Pressable>
    );
  });

  return (
    <View style={[styles.wrap, { borderBottomColor: border }]}>
      {isMobile ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabRow}
        </ScrollView>
      ) : (
        <View style={styles.tabs}>{tabRow}</View>
      )}
      {!isMobile && ratingSlot ? ratingSlot : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
    flexWrap: 'wrap',
  },
  tabs: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  tabsScroll: {
    flexDirection: 'row',
    gap: 2,
    paddingRight: 8,
  },
  tab: { paddingHorizontal: 10, paddingTop: 8, alignItems: 'center' },
  tabMobile: { paddingHorizontal: 12, paddingTop: 6 },
  label: { ...Typography.small, fontSize: 14 },
  labelMobile: { fontSize: 13 },
  underline: { marginTop: 10, height: 2, width: '100%', borderRadius: 1 },
  underlineMobile: { marginTop: 8, height: 2.5 },
});
