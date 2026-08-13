import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { useThemeColor } from '@/hooks/useThemeColor';

type SideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  kicker: string;
  title: string;
  accessibilityLabel: string;
  closeLabel?: string;
  backLabel?: string;
  onBack?: () => void;
  meta?: React.ReactNode;
  children: React.ReactNode;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const DESKTOP_WIDTH = 420;

/** Sağdan kayan frameless panel — favori / profil ortak kabuk. */
export function SideDrawer({
  visible,
  onClose,
  kicker,
  title,
  accessibilityLabel,
  closeLabel = 'Kapat',
  backLabel = 'Geri',
  onBack,
  meta,
  children,
}: SideDrawerProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const panelWidth = isWide
    ? DESKTOP_WIDTH
    : Math.min(width, Math.max(320, width * 0.94));

  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');

  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 380,
        easing: EASE,
        useNativeDriver: true,
      }).start();
      return;
    }
    if (!mounted) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 280,
      easing: EASE,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, mounted, progress]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, onClose]);

  if (!mounted) return null;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [panelWidth, 0],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View
      style={styles.root}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            backgroundColor: surface,
            paddingTop: Math.max(insets.top, 28),
            paddingBottom: Math.max(insets.bottom, 24),
            transform: [{ translateX }],
            ...Platform.select({
              web: {
                boxShadow: '-24px 0 64px rgba(12,12,14,0.12)',
              },
              default: {},
            }),
          },
        ]}
        accessibilityRole="menu"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerLead}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={backLabel}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { opacity: pressed ? 0.4 : 1 },
                ]}
              >
                <Ionicons name="chevron-back" size={22} color={text} />
              </Pressable>
            ) : null}
            <View style={styles.headerText}>
              <Text style={[styles.kicker, { color: textMuted }]}>{kicker}</Text>
              <Text style={[styles.title, { color: text }]}>{title}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {meta}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              style={({ pressed }) => [
                styles.closeBtn,
                { opacity: pressed ? 0.4 : 1 },
              ]}
            >
              <Ionicons name="close" size={20} color={text} />
            </Pressable>
          </View>
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      default: {},
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,14,0.28)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
      default: {},
    }),
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 20,
    marginBottom: 8,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    gap: 4,
    flexShrink: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
