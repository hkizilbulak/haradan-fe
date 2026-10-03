import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { openVideoUrl, parseVideoUrl } from '@/utils/videoUrl';

type AdvertVideoPreviewProps = {
  videoUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function AdvertVideoPreview({
  videoUrl,
  style,
  compact = false,
}: AdvertVideoPreviewProps) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');

  const parsed = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  if (!parsed.isValid) {
    return null;
  }

  const handlePress = () => {
    openVideoUrl(parsed.url);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: surface, borderColor: border },
        style,
      ]}
    >
      <View style={[styles.header, { borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: `${primary}18` }]}>
            <Ionicons name="videocam" size={17} color={primary} />
          </View>
          <Text style={[styles.headerTitle, { color: text }]}>İlan Videosu</Text>
          <View
            style={[
              styles.platformBadge,
              parsed.platform === 'youtube' && styles.platformBadgeYouTube,
              parsed.platform === 'vimeo' && styles.platformBadgeVimeo,
            ]}
          >
            {parsed.platform === 'youtube' ? (
              <Ionicons name="logo-youtube" size={13} color="#FFFFFF" />
            ) : (
              <Ionicons name="play-circle" size={13} color="#FFFFFF" />
            )}
            <Text style={styles.platformBadgeText}>{parsed.platformName}</Text>
          </View>
        </View>

        <Pressable
          onPress={handlePress}
          accessibilityRole="link"
          accessibilityLabel="Videoyu yeni sekmede izle"
          style={({ pressed }) => [
            styles.openTabBtn,
            { borderColor: border, backgroundColor: `${primary}0D` },
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={[styles.openTabBtnText, { color: primary }]}>
            Yeni sekmede izle
          </Text>
          <Ionicons name="open-outline" size={13} color={primary} />
        </Pressable>
      </View>

      <Pressable
        onPress={handlePress}
        accessibilityRole="link"
        accessibilityLabel={`${parsed.platformName} videosunu izlemek için tıklayın`}
        style={({ pressed }) => [
          styles.mediaContainer,
          compact && styles.mediaContainerCompact,
          pressed && { opacity: 0.92 },
        ]}
      >
        {parsed.thumbnailUrl ? (
          <Image
            source={{ uri: parsed.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.fallbackThumbnail,
              { backgroundColor: '#0f172a' },
            ]}
          >
            <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Ambient Dark Gradient / Overlay */}
        <View style={styles.scrimOverlay} />

        {/* Large Centered Play Button */}
        <View style={styles.centerPlayArea}>
          <View style={styles.playButtonGlow}>
            <View style={styles.playButtonInner}>
              <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
          </View>
          <Text style={styles.playHintText}>
            {parsed.platformName} üzerinde oynat
          </Text>
        </View>

        {/* Bottom Bar Info */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Ionicons name="arrow-redo-outline" size={14} color="#FFFFFF" />
            <Text style={styles.bottomBarUrl} numberOfLines={1}>
              {parsed.url}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 3px 14px rgba(0, 0, 0, 0.05)',
      } as any,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformBadgeYouTube: {
    backgroundColor: '#CC0000',
  },
  platformBadgeVimeo: {
    backgroundColor: '#1AB7EA',
  },
  platformBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  openTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  openTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 380,
    backgroundColor: '#000000',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    overflow: 'hidden',
  },
  mediaContainerCompact: {
    maxHeight: 260,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fallbackThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  centerPlayArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playButtonGlow: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        transition: 'transform 0.2s ease',
      } as any,
      default: {},
    }),
  },
  playHintText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  bottomBarUrl: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
});
