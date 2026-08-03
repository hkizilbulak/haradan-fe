import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  /** Ek kapsayıcı stili */
  style?: ViewStyle;

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
  style,
  children,
}: ScreenWrapperProps) {
  const bg = useThemeColor('background');

  // Öncelik: loading > error > empty > içerik
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: bg }]}>
        <LoadingState variant={loadingVariant} count={loadingCount} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: bg }]}>
        <ErrorState
          variant={errorVariant}
          title={errorTitle}
          message={errorMessage}
          onRetry={onRetry}
          secondaryLabel={errorSecondaryLabel}
          onSecondaryAction={onErrorSecondaryAction}
        />
      </SafeAreaView>
    );
  }

  if (isEmpty) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: bg }]}>
        <EmptyState
          variant={emptyVariant}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
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
      <SafeAreaView style={[styles.flex, { backgroundColor: bg }]}>
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: bg }]}>
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
