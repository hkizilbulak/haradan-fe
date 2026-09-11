import React, { memo, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertDetail } from '@/types';
import { formatMoney } from '@/utils/formatMoney';
import { useAdvertLocation } from '@/services/location';
import { WHATSAPP_GREEN } from '@/utils/contactLinks';
import {
  buildAdvertInfoRows,
  type AdvertInfoRow,
} from './advertCategoryHelper';

type AdvertBuyBoxProps = {
  detail: AdvertDetail;
  favorite?: boolean;
  isOwner?: boolean;
  variant?: 'default' | 'mobile';
  onToggleFavorite?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEdit?: () => void;
};

/** Sağ kolon — Yüksek kaliteli Genel Bilgiler tablosu, iletişim aksiyonları ve ilan açıklaması. */
export const AdvertBuyBox = memo(function AdvertBuyBox({
  detail,
  variant = 'default',
  favorite = false,
  isOwner = false,
  onToggleFavorite,
  onCall,
  onWhatsApp,
  onEdit,
}: AdvertBuyBoxProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const isSold = detail.backendStatus === 'SOLD';
  const showActions = Boolean(onCall || onWhatsApp || onEdit || onToggleFavorite);

  const location = useAdvertLocation(detail);

  const infoRows = useMemo(() => {
    return buildAdvertInfoRows(detail);
  }, [detail]);

  return (
    <View style={styles.wrap}>
      {/* Genel Bilgiler Tablosu */}
      <View style={[styles.infoTableCard, { backgroundColor: surface, borderColor: border }]}>
        <View style={[styles.infoTableHeader, { borderBottomColor: border }]}>
          <View style={styles.headerLocationWrap}>
            <Ionicons name="location-outline" size={16} color={primary} />
            <Text style={[styles.headerLocationText, { color: textSecondary }]} numberOfLines={1}>
              {location && location !== '-' && location.trim() !== '' ? location : 'Konum Belirtilmedi'}
            </Text>
          </View>
          <Text style={[styles.headerPriceText, { color: text }]}>
            {formatMoney(detail.price)}
          </Text>
        </View>

        <View style={styles.infoTableBody}>
          {infoRows.map((row, idx) => {
            const isLast = idx === infoRows.length - 1;
            const isClickable = Boolean(row.onPress);
            return (
              <View
                key={`${row.label}-${idx}`}
                style={[
                  styles.infoTableRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
                ]}
              >
                <View style={styles.rowLabelWrap}>
                  <Text style={[styles.infoRowLabel, { color: textSecondary }]}>{row.label}</Text>
                </View>

                {isClickable ? (
                  <Pressable
                    onPress={row.onPress}
                    style={({ pressed }) => [
                      styles.clickableChip,
                      { backgroundColor: `${primary}16`, borderColor: `${primary}35` },
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clickableChipText,
                        { color: primary },
                      ]}
                      numberOfLines={1}
                    >
                      {row.value}
                    </Text>
                    <Ionicons name="open-outline" size={12} color={primary} style={{ marginLeft: 3 }} />
                  </Pressable>
                ) : row.isBoolean && (row.value === 'Evet' || row.value === 'Hayır') ? (
                  <View
                    style={[
                      styles.booleanBadge,
                      row.value === 'Evet'
                        ? styles.booleanBadgeSuccess
                        : styles.booleanBadgeDanger,
                    ]}
                  >
                    <Ionicons
                      name={row.value === 'Evet' ? 'checkmark' : 'close'}
                      size={12}
                      color={row.value === 'Evet' ? '#22c55e' : '#ef4444'}
                    />
                    <Text
                      style={[
                        styles.booleanBadgeText,
                        { color: row.value === 'Evet' ? '#22c55e' : '#ef4444' },
                      ]}
                    >
                      {row.value}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.infoRowValue, { color: text }]} numberOfLines={1}>
                    {row.value}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {detail.description ? (
        <View style={[styles.descCard, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.descHeader}>
            <Ionicons name="document-text-outline" size={16} color={textMuted} />
            <Text style={[styles.blockLabel, { color: text }]}>
              İlan Açıklaması
            </Text>
          </View>
          {Platform.OS === 'web' ? (
            <div
              style={{
                color: textSecondary,
                fontSize: 13.5,
                lineHeight: 1.6,
                wordBreak: 'break-word',
              }}
              dangerouslySetInnerHTML={{ __html: detail.description }}
            />
          ) : (
            <Text style={[styles.desc, { color: textSecondary }]}>
              {detail.description.replace(/<[^>]+>/g, '')}
            </Text>
          )}
        </View>
      ) : null}

      {detail.backendStatus === 'REJECTED' ? (
        <View style={[styles.descCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <View style={styles.descHeader}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={[styles.blockLabel, { color: '#B91C1C' }]}>
              Red Nedeni
            </Text>
          </View>
          <Text style={[styles.desc, { color: '#991B1B' }]}>
            {detail.rejectionReason || 'Bu ilan moderasyon tarafından onaylanmadı.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  infoTableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  infoTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerLocationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerLocationText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerPriceText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  infoTableBody: {
    paddingVertical: 4,
  },
  infoTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  rowIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  infoRowLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  infoRowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  clickableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  clickableChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  booleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  booleanBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  booleanBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.24)',
  },
  booleanBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  descCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: '400',
  },
  actionRow: {
    width: '100%',
  },
  actionsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cta: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14.5,
    letterSpacing: -0.1,
  },
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  editBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  editText: {
    fontWeight: '700',
    fontSize: 14.5,
  },
});
