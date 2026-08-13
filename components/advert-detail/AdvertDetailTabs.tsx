import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertDetailTab } from '@/types';

type Tab = { key: AdvertDetailTab; label: string };

type AdvertDetailTabsProps = {
  tabs: Tab[];
  active: AdvertDetailTab;
  onChange: (key: AdvertDetailTab) => void;
  ratingSlot?: React.ReactNode;
};

export const AdvertDetailTabs = memo(function AdvertDetailTabs({
  tabs,
  active,
  onChange,
  ratingSlot,
}: AdvertDetailTabsProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const header = useThemeColor('header');

  return (
    <View style={[styles.wrap, { borderBottomColor: border }]}>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.label,
                  { color: isActive ? text : textMuted, fontWeight: isActive ? '700' : '500' },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.underline,
                  { backgroundColor: isActive ? header : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      {ratingSlot}
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
  tab: { paddingHorizontal: 10, paddingTop: 8, alignItems: 'center' },
  label: { ...Typography.small, fontSize: 14 },
  underline: { marginTop: 10, height: 2, width: '100%', borderRadius: 1 },
});
