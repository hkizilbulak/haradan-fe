import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { MyListingStatus } from '@/types';

const TABS: { key: MyListingStatus; label: string }[] = [
  { key: 'published', label: 'Yayında' },
  { key: 'draft', label: 'Taslak' },
  { key: 'sold', label: 'Satılmış' },
];

type MyListingsTabsProps = {
  active: MyListingStatus;
  counts: Record<MyListingStatus, number>;
  onChange: (key: MyListingStatus) => void;
};

export function MyListingsTabs({
  active,
  counts,
  onChange,
}: MyListingsTabsProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const header = useThemeColor('header');

  return (
    <View style={[styles.wrap, { borderBottomColor: border }]}>
      {TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={styles.tab}
          >
            <Text
              style={[
                styles.label,
                {
                  color: on ? text : muted,
                  fontWeight: on ? '700' : '500',
                },
              ]}
            >
              {tab.label}
              {counts[tab.key] > 0 ? `  ${counts[tab.key]}` : ''}
            </Text>
            <View
              style={[
                styles.line,
                { backgroundColor: on ? header : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  label: { ...Typography.small, fontSize: 14 },
  line: {
    marginTop: 10,
    height: 2,
    width: '70%',
    borderRadius: 1,
  },
});
