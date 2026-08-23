import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LoadingState, LoadingVariant } from './LoadingState';
import { EmptyState, EmptyVariant } from './EmptyState';
import { ErrorState, ErrorVariant } from './ErrorState';

interface ScreenWrapperProps {
  /** Yükleniyor mu? */
  isLoading?: boolean;
  /** Hata var mı? */
  isError?: boolean;
  /** İçerik boş mu? */
  isEmpty?: boolean;

  // --- Loading ---
  loadingVariant?: LoadingVariant;
  loadingCount?: number;

  // --- Empty ---
  emptyVariant?: EmptyVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;

  // --- Error ---
  errorVariant?: ErrorVariant;
  errorTitle?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  errorSecondaryLabel?: string;
  onErrorSecondaryAction?: () => void;

  /** İçerik scroll'lanabilir mi? (varsayılan: true) */
  scrollable?: boolean;
  /** Safe area kenarları (varsayılan: tüm kenarlar) */
  edges?: readonly Edge[];
  /** Ek kapsayıcı stili */
  style?: ViewStyle;
  /** Alt dock / safe area için içerik boşluğu (empty/loading/error). */
  contentInsetBottom?: number;

  children: React.ReactNode;
}

/**
 * Tüm sayfalarda tutarlı loading / empty / error deneyimi sağlayan sarmalayıcı.
 *
 * @example
 * export default function ListingsScreen() {
 *   const { data, isLoading, isError, isEmpty, error, refetch } = useAsync(
 *     api.listings.list
 *   );
 *
 *   return (
 *     <ScreenWrapper
 *       isLoading={isLoading}
 *       isError={isError}
 *       isEmpty={isEmpty}
 *       errorMessage={error}
 *       onRetry={refetch}
 *       emptyVariant="listing"
 *       emptyTitle="Henüz ilan yok"
 *     >
 *       <ListingList data={data!} />
 *     </ScreenWrapper>
 *   );
 * }
 */
export function ScreenWrapper({
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingVariant = 'cards',
  loadingCount = 3,
  emptyVariant = 'generic',
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  errorVariant = 'generic',
  errorTitle,
  errorMessage,
  onRetry,
  errorSecondaryLabel,
  onErrorSecondaryAction,
  scrollable = true,
  edges,
  style,
  contentInsetBottom = 0,
  children,
}: ScreenWrapperProps) {
  const bg = useThemeColor('background');
  const safeEdges = edges ?? (['top', 'right', 'bottom', 'left'] as const);
  const insetStyle =
    contentInsetBottom > 0
      ? { paddingBottom: contentInsetBottom }
      : undefined;

  // Öncelik: loading > error > empty > içerik
  if (isLoading) {
    return (
      <SafeAreaView edges={safeEdges} style={[styles.flex, { backgroundColor: bg }]}>
        <View style={[styles.flex, insetStyle]}>
          <LoadingState variant={loadingVariant} count={loadingCount} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView edges={safeEdges} style={[styles.flex, { backgroundColor: bg }]}>
        <View style={[styles.flex, insetStyle]}>
          <ErrorState
            variant={errorVariant}
            title={errorTitle}
            message={errorMessage}
            onRetry={onRetry}
            secondaryLabel={errorSecondaryLabel}
            onSecondaryAction={onErrorSecondaryAction}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isEmpty) {
    return (
      <SafeAreaView edges={safeEdges} style={[styles.flex, { backgroundColor: bg }]}>
        <View style={[styles.flex, insetStyle]}>
          <EmptyState
            variant={emptyVariant}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </View>
      </SafeAreaView>
    );
  }

  const content = (
    <View style={[styles.flex, { backgroundColor: bg }, style]}>
      {children}
    </View>
  );

  if (!scrollable) {
    return (
      <SafeAreaView edges={safeEdges} style={[styles.flex, { backgroundColor: bg }]}>
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={safeEdges} style={[styles.flex, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
