import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MY_LISTING_TABS } from '@/services/my-listings';
import type { MyListingStatus } from '@/types';

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
      style={[styles.scroll, { borderBottomColor: border }]}
    >
      {MY_LISTING_TABS.map((tab) => {
        const on = active === tab.key;
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
              numberOfLines={1}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Platform.OS === 'web' ? 0 : -4,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: '100%',
  },
  tab: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 10,
    minWidth: 88,
  },
  label: { ...Typography.small, fontSize: 13 },
  line: {
    marginTop: 10,
    height: 2,
    width: '70%',
    borderRadius: 1,
    alignSelf: 'center',
  },
});
