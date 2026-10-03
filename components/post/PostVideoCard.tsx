import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { openVideoUrl, parseVideoUrl } from '@/utils/videoUrl';

type PostVideoCardProps = {
  value?: string | null;
  onChange: (url: string) => void;
  onLayout?: (e: any) => void;
};

export function PostVideoCard({
  value,
  onChange,
  onLayout,
}: PostVideoCardProps) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');
  const inputBg = useThemeColor('background');

  const rawUrl = value ?? '';
  const parsed = useMemo(() => parseVideoUrl(rawUrl), [rawUrl]);

  return (
    <View
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onLayout={onLayout}
    >
      <View style={[styles.cardHeader, { borderBottomColor: border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.iconWrap, { backgroundColor: `${primary}15` }]}>
              <Ionicons name="videocam-outline" size={18} color={primary} />
            </View>
            <Text style={[styles.section, { color: text }]}>Video Linki</Text>
            <View style={[styles.optionalBadge, { borderColor: border }]}>
              <Text style={[styles.optionalBadgeText, { color: secondary }]}>
                İsteğe Bağlı
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.cardDesc, { color: secondary }]}>
          İlanınıza YouTube, Vimeo veya web video bağlantısı ekleyerek alıcıların ilgisini çekebilirsiniz.
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: inputBg, borderColor: border },
          ]}
        >
          <Ionicons
            name="link-outline"
            size={18}
            color={secondary}
            style={styles.inputIcon}
          />
          <TextInput
            value={rawUrl}
            onChangeText={onChange}
            placeholder="Örn: https://www.youtube.com/watch?v=..."
            placeholderTextColor={`${secondary}88`}
            style={[styles.textInput, { color: text }]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {rawUrl.length > 0 && (
            <Pressable
              hitSlop={8}
              onPress={() => onChange('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color={secondary} />
            </Pressable>
          )}
        </View>

        {/* Video Preview if valid */}
        {parsed.isValid ? (
          <View
            style={[
              styles.previewContainer,
              { backgroundColor: inputBg, borderColor: border },
            ]}
          >
            <Pressable
              style={styles.thumbnailWrapper}
              onPress={() => openVideoUrl(parsed.url)}
              accessibilityRole="link"
              accessibilityLabel="Videoyu yeni sekmede aç"
            >
              {parsed.thumbnailUrl ? (
                <Image
                  source={{ uri: parsed.thumbnailUrl }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.thumbnailPlaceholder,
                    { backgroundColor: `${primary}10` },
                  ]}
                >
                  <Ionicons name="videocam" size={36} color={primary} />
                </View>
              )}

              {/* Play Button Overlay */}
              <View style={styles.playOverlay}>
                <View style={styles.playButtonCircle}>
                  <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              </View>

              {/* Platform Tag */}
              <View style={styles.platformBadge}>
                {parsed.platform === 'youtube' && (
                  <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                )}
                <Text style={styles.platformBadgeText}>{parsed.platformName}</Text>
              </View>
            </Pressable>

            <View style={styles.previewInfo}>
              <View style={styles.previewTextGroup}>
                <Text style={[styles.previewTitle, { color: text }]} numberOfLines={1}>
                  {parsed.platformName} Videosu Eklendi
                </Text>
                <Text style={[styles.previewUrl, { color: secondary }]} numberOfLines={1}>
                  {parsed.url}
                </Text>
              </View>

              <Pressable
                style={[styles.openLinkBtn, { borderColor: border }]}
                onPress={() => openVideoUrl(parsed.url)}
              >
                <Ionicons name="open-outline" size={15} color={primary} />
                <Text style={[styles.openLinkBtnText, { color: primary }]}>
                  Yeni sekmede aç
                </Text>
              </Pressable>
            </View>
          </View>
        ) : rawUrl.trim().length > 0 ? (
          <View style={styles.hintRow}>
            <Ionicons name="alert-circle-outline" size={15} color="#e53935" />
            <Text style={[styles.hintText, { color: '#e53935' }]}>
              Lütfen geçerli bir video bağlantısı girin (örn. YouTube veya Vimeo linki).
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      } as any,
      default: {},
    }),
  },
  cardHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    ...Typography.h5,
    fontWeight: '700',
    fontSize: 16,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDesc: {
    ...Typography.caption,
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 17,
  },
  cardBody: {
    padding: Spacing.lg,
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    minHeight: 40,
    outlineStyle: 'none' as any,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
    backgroundColor: '#000000',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)' as any,
  },
  platformBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platformBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  previewInfo: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewTextGroup: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  previewUrl: {
    fontSize: 12,
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  openLinkBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  hintText: {
    fontSize: 12,
    flex: 1,
  },
});
