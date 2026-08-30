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
  variant?: 'default' | 'glass';
};

/**
 * Önerilen Aramalar (Hızlı Arama Linkleri) şeridi.
 */
export const QuickSearchStrip = memo(function QuickSearchStrip({
  links = DEFAULT_QUICK_LINKS,
  title,
  variant = 'default',
}: QuickSearchStripProps) {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isGlass = variant === 'glass';

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
    <View style={[styles.container, isGlass && styles.containerGlass]}>
      {title ? (
        <View style={[styles.headerRow, isGlass && styles.headerRowGlass]}>
          <Text
            style={[
              styles.titleText,
              { color: isGlass ? 'rgba(255, 255, 255, 0.85)' : textMuted },
            ]}
          >
            {title}
          </Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isGlass && styles.scrollContentGlass,
        ]}
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
                backgroundColor: isGlass
                  ? pressed
                    ? 'rgba(255, 255, 255, 0.32)'
                    : 'rgba(255, 255, 255, 0.18)'
                  : pressed
                    ? isDark
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(0, 0, 0, 0.08)'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : surface,
                borderColor: isGlass
                  ? pressed
                    ? 'rgba(255, 255, 255, 0.55)'
                    : 'rgba(255, 255, 255, 0.32)'
                  : border,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...(Platform.OS === 'web'
                  ? ({
                      backdropFilter: isGlass
                        ? 'blur(12px) saturate(140%)'
                        : undefined,
                      WebkitBackdropFilter: isGlass
                        ? 'blur(12px) saturate(140%)'
                        : undefined,
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
                color={
                  isGlass
                    ? 'rgba(255, 255, 255, 0.9)'
                    : link.iconColor ?? (isDark ? '#e2e8f0' : '#475569')
                }
              />
            ) : null}
            <Text
              style={[
                styles.chipText,
                { color: isGlass ? '#ffffff' : text },
              ]}
            >
              {link.label}
            </Text>
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
    gap: 6,
  },
  containerGlass: {
    marginTop: 0,
    marginBottom: 0,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  headerRowGlass: {
    paddingHorizontal: 2,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  scrollContentGlass: {
    paddingHorizontal: 0,
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
