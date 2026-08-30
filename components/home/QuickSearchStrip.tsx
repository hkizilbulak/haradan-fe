import React, { memo, useCallback } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { navigateToListings } from '@/services/navigation';
import { DEFAULT_QUICK_LINKS, type QuickSearchLink } from './HomeSearchBar';

type QuickSearchStripProps = {
  links?: QuickSearchLink[];
  title?: string;
};

/**
 * Slider altında yer alan Önerilen Aramalar (Hızlı Arama Linkleri) şeridi.
 */
export const QuickSearchStrip = memo(function QuickSearchStrip({
  links = DEFAULT_QUICK_LINKS,
  title = 'Önerilen Aramalar',
}: QuickSearchStripProps) {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const handlePress = useCallback(
    (link: QuickSearchLink) => {
      if (link.query) {
        navigateToListings(router, { q: link.query, ...link.params });
      } else if (link.params) {
        navigateToListings(router, link.params);
      }
    },
    [router]
  );

  if (!links || links.length === 0) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <View style={styles.headerRow}>
          <Ionicons name="sparkles" size={13} color={useThemeColor('primary')} />
          <Text style={[styles.titleText, { color: textMuted }]}>{title}</Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {links.map((link) => (
          <Pressable
            key={link.id}
            onPress={() => handlePress(link)}
            accessibilityRole="button"
            accessibilityLabel={link.label}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: pressed
                  ? isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(0, 0, 0, 0.08)'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : surface,
                borderColor: border,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...(Platform.OS === 'web'
                  ? ({
                      cursor: 'pointer',
                      transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
                    } as object)
                  : null),
              },
            ]}
          >
            {link.icon ? (
              <Ionicons
                name={link.icon}
                size={13}
                color={link.iconColor ?? (isDark ? '#e2e8f0' : '#475569')}
              />
            ) : null}
            <Text style={[styles.chipText, { color: text }]}>{link.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
