import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ErrorVariant =
  | 'network'    // internet bağlantısı yok
  | 'server'     // 5xx
  | 'notFound'   // 404
  | 'auth'       // 401 / 403
  | 'generic';   // bilinmeyen hata

interface ErrorConfig {
  icon: string;
  defaultTitle: string;
  defaultDescription: string;
}

const ERROR_MAP: Record<ErrorVariant, ErrorConfig> = {
  network: {
    icon: '📡',
    defaultTitle: 'Bağlantı Hatası',
    defaultDescription:
      'İnternet bağlantınızı kontrol edip tekrar deneyin.',
  },
  server: {
    icon: '⚙️',
    defaultTitle: 'Sunucu Hatası',
    defaultDescription:
      'Şu an bir sorun yaşıyoruz. Lütfen kısa süre sonra tekrar deneyin.',
  },
  notFound: {
    icon: '🔎',
    defaultTitle: 'İçerik Bulunamadı',
    defaultDescription:
      'Aradığınız sayfa ya da içerik mevcut değil.',
  },
  auth: {
    icon: '🔒',
    defaultTitle: 'Erişim Reddedildi',
    defaultDescription:
      'Bu içeriği görüntülemek için giriş yapmanız gerekiyor.',
  },
  generic: {
    icon: '⚠️',
    defaultTitle: 'Bir Hata Oluştu',
    defaultDescription:
      'Beklenmeyen bir sorunla karşılaştık. Tekrar deneyebilirsiniz.',
  },
};

interface ErrorStateProps {
  /** Hata türü — ikon ve varsayılan metni belirler */
  variant?: ErrorVariant;
  /** Hata başlığı (varsayılanı geçersiz kılar) */
  title?: string;
  /** Hata açıklaması veya API'den gelen mesaj */
  message?: string | null;
  /** "Tekrar Dene" düğmesine basıldığında */
  onRetry?: () => void;
  /** Yardımcı ikincil eylem (ör. "Giriş Yap") */
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * Hata ekranı — veri yükleme veya işlem hatalarında gösterilir.
 *
 * @example
 * <ErrorState
 *   variant="network"
 *   message={error}
 *   onRetry={refetch}
 * />
 */
export function ErrorState({
  variant = 'generic',
  title,
  message,
  onRetry,
  secondaryLabel,
  onSecondaryAction,
}: ErrorStateProps) {
  const config = ERROR_MAP[variant];

  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const errorColor = useThemeColor('error');
  const errorLight = useThemeColor('errorLight');
  const primary = useThemeColor('primary');

  const displayTitle = title ?? config.defaultTitle;
  const displayMessage = message ?? config.defaultDescription;

  return (
    <View style={[styles.wrapper, { backgroundColor: bg }]}>
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        {/* İkon alanı */}
        <View style={[styles.iconContainer, { backgroundColor: errorLight }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>

        {/* Metin alanı */}
        <Text style={[styles.title, { color: text }]}>{displayTitle}</Text>
        <Text style={[styles.message, { color: textMuted }]}>
          {displayMessage}
        </Text>

        {/* Eylem düğmeleri */}
        <View style={styles.actions}>
          {onRetry ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: errorColor }]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                Tekrar Dene
              </Text>
            </TouchableOpacity>
          ) : null}

          {secondaryLabel && onSecondaryAction ? (
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: primary },
              ]}
              onPress={onSecondaryAction}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: primary }]}>
                {secondaryLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 50,
    alignItems: 'center',
  },
  primaryButton: {
    // backgroundColor handled inline
  },
  secondaryButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
