import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, usePathname } from 'expo-router';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryTreeNode } from '@/types';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'satilik-atlar': 'trophy-outline',
  'at-hizmetleri': 'briefcase-outline',
  'asim-hizmetleri': 'pulse-outline',
  'ekipman-malzemeler': 'construct-outline',
  'ahir-tesisler': 'home-outline',
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const IDLE_TEXT = '#6c727f';
const ACTIVE_TEXT = '#1d2129';
const MAIN_WIDTH = 248;
const FLYOUT_WIDTH = 232;

type CategorySidebarProps = {
  categories: CategoryTreeNode[];
  onSelect?: (category: CategoryTreeNode) => void;
  maxHeight?: number;
};

/** Browse kategorileri — seçim üst bileşene (ilanlar?category=slug). */
export const CategorySidebar = memo(function CategorySidebar({
  categories,
  onSelect,
  maxHeight,
}: CategorySidebarProps) {
  const pathname = usePathname();
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === activeId) ?? null;
  const hasFlyout =
    isWide && activeCategory != null && activeCategory.children.length > 0;
  const isMenuOpen =
    activeCategory != null && activeCategory.children.length > 0;

  /** Eve dönüşte açık menü / dismiss katmanı tıklamayı yutmasın. */
  useFocusEffect(
    useCallback(() => {
      setActiveId(null);
      return () => setActiveId(null);
    }, [])
  );

  useEffect(() => {
    setActiveId(null);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const close = () => setActiveId(null);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onPointer = (event: Event) => {
        const root = document.getElementById('haradan-category-sidebar');
        const target = event.target;
        if (root && target instanceof Node && root.contains(target)) return;
        close();
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
      };
      document.addEventListener('mousedown', onPointer);
      document.addEventListener('touchstart', onPointer);
      window.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onPointer);
        document.removeEventListener('touchstart', onPointer);
        window.removeEventListener('keydown', onKey);
      };
    }

    return undefined;
  }, [isMenuOpen]);

  const selectCategory = useCallback(
    (cat: CategoryTreeNode) => {
      setActiveId(null);
      onSelect?.(cat);
    },
    [onSelect]
  );

  if (categories.length === 0) return null;

  /**
   * Kategori tıklaması → /listings?category=slug filtrelenmiş git.
   * Web hover → flyout aç.
   * Chevron tık → alt kategorileri toggle et.
   */
  const handleRootPress = (cat: CategoryTreeNode) => {
    selectCategory(cat);
  };

  const handleRootHover = (cat: CategoryTreeNode) => {
    if (isWide && cat.children.length > 0) {
      setActiveId(cat.id);
    }
  };

  const handleChevronPress = (cat: CategoryTreeNode) => {
    if (cat.children.length > 0) {
      setActiveId((prev) => (prev === cat.id ? null : cat.id));
    }
  };

  const handleParentBrowseAll = (cat: CategoryTreeNode) => {
    selectCategory(cat);
  };

  const handleChildPress = (child: CategoryTreeNode) => {
    selectCategory(child);
  };

  return (
    <View
      nativeID="haradan-category-sidebar"
      style={[
        styles.shell,
        maxHeight ? { maxHeight } : null,
        hasFlyout && styles.shellExpanded,
      ]}
      accessibilityRole="menu"
      {...(Platform.OS === 'web'
        ? ({
            onMouseLeave: () => setActiveId(null),
          } as object)
        : null)}
    >
      {isMenuOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kategorileri kapat"
          onPress={() => setActiveId(null)}
          style={styles.dismissLayer}
        />
      ) : null}
      <View style={[styles.mainPanel, { width: MAIN_WIDTH }]}>
        <Text style={[styles.heading, { color: textMuted }]}>Browse</Text>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              label={cat.name}
              icon={CATEGORY_ICONS[cat.slug] ?? 'ellipse-outline'}
              active={cat.id === activeId}
              hasChildren={cat.children.length > 0}
              expanded={cat.id === activeId && cat.children.length > 0}
              onPress={() => handleRootPress(cat)}
              onHover={() => handleRootHover(cat)}
              onChevronPress={() => handleChevronPress(cat)}
            />
          ))}

          {!isWide && activeCategory && activeCategory.children.length > 0 ? (
            <SubcategoryList
              parent={activeCategory}
              items={activeCategory.children}
              onSelectParent={handleParentBrowseAll}
              onSelect={handleChildPress}
              inline
            />
          ) : null}
        </ScrollView>
      </View>

      {hasFlyout && activeCategory ? (
        <CategoryFlyout
          parent={activeCategory}
          items={activeCategory.children}
          borderColor={border}
          surfaceColor={surface}
          onSelect={handleChildPress}
          onBrowseAll={() => handleParentBrowseAll(activeCategory)}
          onClose={() => setActiveId(null)}
        />
      ) : null}
    </View>
  );
});

function CategoryFlyout({
  parent,
  items,
  borderColor,
  surfaceColor,
  onSelect,
  onBrowseAll,
  onClose,
}: {
  parent: CategoryTreeNode;
  items: CategoryTreeNode[];
  borderColor: string;
  surfaceColor: string;
  onSelect: (item: CategoryTreeNode) => void;
  onBrowseAll: () => void;
  onClose: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateX.setValue(-10);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start();
  }, [parent.id, opacity, translateX]);

  return (
    <Animated.View
      style={[
        styles.flyout,
        {
          width: FLYOUT_WIDTH,
          backgroundColor: surfaceColor,
          borderColor,
          opacity,
          transform: [{ translateX }],
          ...Platform.select({
            web: { boxShadow: '0 12px 32px rgba(15,23,42,0.08)' },
            default: {},
          }),
        },
      ]}
      accessibilityRole="menu"
      accessibilityLabel={`${parent.name} alt kategorileri`}
      // Hero / dismiss katmanının üstünde kalsın; tıklanabilir olsun.
      pointerEvents="auto"
    >
      <View style={styles.flyoutHeader}>
        <Pressable
          onPress={onBrowseAll}
          accessibilityRole="button"
          accessibilityLabel={`${parent.name} — tümünü gör`}
          style={({ pressed }) => [
            styles.flyoutTitlePress,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.flyoutTitle} numberOfLines={1}>
            {parent.name}
          </Text>
          <Text style={styles.flyoutAll}>Tümü</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Alt kategorileri kapat"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={16} color={IDLE_TEXT} />
        </Pressable>
      </View>
      <SubcategoryList
        parent={parent}
        items={items}
        onSelectParent={() => onBrowseAll()}
        onSelect={onSelect}
        showBrowseAll={false}
      />
    </Animated.View>
  );
}

function SubcategoryList({
  parent,
  items,
  onSelectParent,
  onSelect,
  inline = false,
  showBrowseAll = true,
}: {
  parent: CategoryTreeNode;
  items: CategoryTreeNode[];
  onSelectParent: (item: CategoryTreeNode) => void;
  onSelect: (item: CategoryTreeNode) => void;
  inline?: boolean;
  showBrowseAll?: boolean;
}) {
  return (
    <View style={inline ? styles.inlineList : undefined}>
      {showBrowseAll ? (
        <SubcategoryRow
          label={`Tüm ${parent.name}`}
          emphasized
          onPress={() => onSelectParent(parent)}
        />
      ) : null}
      {items.map((item) => (
        <SubcategoryRow
          key={item.id}
          label={item.name}
          onPress={() => onSelect(item)}
        />
      ))}
    </View>
  );
}

function SubcategoryRow({
  label,
  onPress,
  emphasized = false,
}: {
  label: string;
  onPress: () => void;
  emphasized?: boolean;
}) {
  const press = useRef(new Animated.Value(0)).current;

  const bg = press.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(15,23,42,0)', 'rgba(15,23,42,0.05)'],
  });

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Animated.timing(press, {
          toValue: 1,
          duration: 110,
          easing: EASE,
          useNativeDriver: false,
        }).start();
      }}
      onPressOut={() => {
        Animated.timing(press, {
          toValue: 0,
          duration: 200,
          easing: EASE,
          useNativeDriver: false,
        }).start();
      }}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[styles.subRow, { backgroundColor: bg, transform: [{ scale }] }]}
      >
        <Text
          style={[styles.subLabel, emphasized && styles.subLabelEmphasized]}
          numberOfLines={2}
        >
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={13} color={IDLE_TEXT} />
      </Animated.View>
    </Pressable>
  );
}

function CategoryRow({
  label,
  icon,
  active,
  hasChildren,
  expanded,
  onPress,
  onHover,
  onChevronPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  hasChildren: boolean;
  expanded: boolean;
  onPress: () => void;
  onHover?: () => void;
  onChevronPress?: () => void;
}) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const textMuted = useThemeColor('textMuted');

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: 280,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  const bg = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(15,23,42,0)', 'rgba(15,23,42,0.05)'],
  });

  const labelColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [IDLE_TEXT, ACTIVE_TEXT],
  });

  const chevronOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [hasChildren ? 0.35 : 0.28, 0.85],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const pressScale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  const idleIconOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const activeIconOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        Animated.timing(press, {
          toValue: 1,
          duration: 110,
          easing: EASE,
          useNativeDriver: false,
        }).start();
      }}
      onPressOut={() => {
        Animated.timing(press, {
          toValue: 0,
          duration: 200,
          easing: EASE,
          useNativeDriver: false,
        }).start();
      }}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active, expanded: expanded || undefined }}
      accessibilityLabel={label}
      {...(Platform.OS === 'web' && onHover
        ? ({ onMouseEnter: onHover } as object)
        : null)}
    >
      <Animated.View
        style={[
          styles.row,
          {
            backgroundColor: bg,
            transform: [{ translateX }, { scale: pressScale }],
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Animated.View style={[styles.iconLayer, { opacity: idleIconOpacity }]}>
            <Ionicons name={icon} size={17} color={IDLE_TEXT} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, { opacity: activeIconOpacity }]}>
            <Ionicons name={icon} size={17} color={ACTIVE_TEXT} />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.label, { color: labelColor }]} numberOfLines={2}>
          {label}
        </Animated.Text>

        <Pressable
          onPress={(e) => {
            if (hasChildren && onChevronPress) {
              e.stopPropagation?.();
              onChevronPress();
            }
          }}
          hitSlop={8}
          accessibilityLabel={`${label} alt kategorilerini aç/kapat`}
        >
          <Animated.View style={{ opacity: chevronOpacity }}>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={textMuted}
              style={expanded ? { transform: [{ rotate: '90deg' }] } : undefined}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 4,
  },
  dismissLayer: {
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
      },
      default: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
      },
    }),
  },
  shellExpanded: {
    marginRight: -FLYOUT_WIDTH - 8,
  },
  mainPanel: {
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 3,
  },
  heading: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  label: {
    ...Typography.small,
    flex: 1,
    fontWeight: '500',
  },
  iconWrap: {
    width: 18,
    height: 18,
    flexShrink: 0,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyout: {
    marginLeft: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    alignSelf: 'stretch',
    maxHeight: '100%',
    zIndex: 5,
    elevation: 8,
  },
  flyoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: Spacing.sm,
    marginBottom: 4,
    gap: Spacing.xs,
  },
  flyoutTitlePress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
    minWidth: 0,
  },
  flyoutTitle: {
    ...Typography.small,
    fontWeight: '700',
    color: ACTIVE_TEXT,
    flexShrink: 1,
  },
  flyoutAll: {
    ...Typography.caption,
    fontWeight: '600',
    color: IDLE_TEXT,
    flexShrink: 0,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  subLabel: {
    ...Typography.small,
    flex: 1,
    fontWeight: '500',
    color: IDLE_TEXT,
  },
  subLabelEmphasized: {
    fontWeight: '700',
    color: ACTIVE_TEXT,
  },
  inlineList: {
    marginTop: 4,
    marginBottom: Spacing.sm,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(15,23,42,0.06)',
    marginLeft: 10,
  },
});
