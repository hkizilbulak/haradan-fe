import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

// ---------------------------------------------------------------------------
// Basit SVG benzeri ikon — harici kütüphaneye bağımlılık yok
// ---------------------------------------------------------------------------
const ICONS: Record<string, string> = {
  listing: '🐎',
  search: '🔍',
  favorite: '🤍',
  order: '📦',
  notification: '🔔',
  message: '💬',
  horse: '🐴',
  generic: '📭',
};

export type EmptyVariant = keyof typeof ICONS;

interface EmptyStateProps {
  /** İçerik türüne göre ikon seçer */
  variant?: EmptyVariant;
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
  /** CTA düğmesi etiketi */
  actionLabel?: string;
  /** CTA düğmesine tıklandığında */
  onAction?: () => void;
}

/**
 * Boş veri ekranı — liste sonuç yokken veya henüz içerik oluşturulmamışken
 * gösterilir.
 *
 * @example
 * // Favori listesi boş
 * <EmptyState
 *   variant="favorite"
 *   title="Henüz favori eklemediniz"
 *   description="Beğendiğiniz ilanları favorilere ekleyin."
 *   actionLabel="İlanlara Göz At"
 *   onAction={() => router.push('/listings')}
 * />
 */
export function EmptyState({
  variant = 'generic',
  title = 'Henüz içerik yok',
  description = 'Burada gösterilecek bir şey bulamadık.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');
  const primaryLight = useThemeColor('primaryLight');

  const icon = ICONS[variant] ?? ICONS.generic;

  return (
    <View style={[styles.wrapper, { backgroundColor: bg }]}>
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        {/* İkon alanı */}
        <View style={[styles.iconContainer, { backgroundColor: `${primary}15` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Metin alanı */}
        <Text style={[styles.title, { color: text }]}>{title}</Text>
        <Text style={[styles.description, { color: textSecondary }]}>
          {description}
        </Text>

        {/* İsteğe bağlı eylem düğmesi */}
        {actionLabel && onAction ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primary }]}
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 50,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
