import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@/utils/formatMoney';
import type { ListingDraft, ListingPackage, ListingPackageCode } from '@/types/listing';
import type { PublicCampaign, CouponValidationResult } from '@/types/coupon';
import { listingRepository } from '@/services/listing';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PackagePreviewModal } from './PackagePreviewModal';

type PostPackagesStepProps = {
  packages: ListingPackage[];
  selected: ListingPackageCode | null;
  draft?: ListingDraft;
  error?: string | null;
  onSelect: (code: ListingPackageCode) => void;
  appliedCoupon?: CouponValidationResult | null;
  onApplyCoupon?: (code: string) => Promise<CouponValidationResult>;
  onRemoveCoupon?: () => void;
};

export function PostPackagesStep({
  packages,
  selected,
  draft,
  error,
  onSelect,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: PostPackagesStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const success = useThemeColor('success');
  const successLight = useThemeColor('successLight');
  const errorColor = useThemeColor('error');

  const [previewPkg, setPreviewPkg] = useState<ListingPackage | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<PublicCampaign[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const camps = await (listingRepository.getActiveCampaigns
          ? listingRepository.getActiveCampaigns()
          : Promise.resolve([]));
        if (active) {
          setActiveCampaigns(camps);
        }
      } catch {
        // Non-critical background fetch failure
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim();
    if (!code) {
      setCouponError('Lütfen bir kupon kodu giriniz.');
      return;
    }
    if (!onApplyCoupon) return;

    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await onApplyCoupon(code);
      if (!res.valid) {
        setCouponError(res.message || 'Geçersiz veya süresi dolmuş kupon kodu.');
      } else {
        setCouponInput('');
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Kupon uygulanamadı.');
    } finally {
      setCouponLoading(false);
    }
  };

  const selectedPkg = packages.find((p) => p.code === selected);

  // Helper to extract campaign discount from campaign data or badge/title text
  const extractCampaignDiscount = (
    campaign: PublicCampaign,
    originalMinor: number
  ): { discountMinor: number; campaignPriceMinor: number } | null => {
    // 1. Direct campaign price if defined and less than original
    if (
      campaign.displayCampaignPriceAmountMinor != null &&
      campaign.displayCampaignPriceAmountMinor < originalMinor
    ) {
      return {
        discountMinor: originalMinor - campaign.displayCampaignPriceAmountMinor,
        campaignPriceMinor: campaign.displayCampaignPriceAmountMinor,
      };
    }

    // 2. Parse percentage from badgeText, title, or name (e.g. "%20 İndirim", "20% İndirim")
    const text = `${campaign.badgeText || ''} ${campaign.title || ''} ${campaign.name || ''}`;

    const percentMatch = text.match(/%\s*(\d+(?:[.,]\d+)?)/) || text.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (percentMatch) {
      const pct = parseFloat(percentMatch[1].replace(',', '.'));
      if (!isNaN(pct) && pct > 0 && pct <= 100) {
        const discountMinor = Math.round(originalMinor * (pct / 100));
        return {
          discountMinor,
          campaignPriceMinor: Math.max(0, originalMinor - discountMinor),
        };
      }
    }

    // 3. Parse fixed TL amount (e.g. "₺50 İndirim", "50 TL İndirim")
    const fixedMatch =
      text.match(/[₺TL]\s*(\d+(?:[.,]\d+)?)/i) ||
      text.match(/(\d+(?:[.,]\d+)?)\s*(?:₺|TL)/i);
    if (fixedMatch) {
      const amountTL = parseFloat(fixedMatch[1].replace(',', '.'));
      if (!isNaN(amountTL) && amountTL > 0) {
        const discountMinor = Math.min(originalMinor, Math.round(amountTL * 100));
        return {
          discountMinor,
          campaignPriceMinor: Math.max(0, originalMinor - discountMinor),
        };
      }
    }

    return null;
  };

  // Helper to get campaign discount for a package (supports both package-specific and all-packages campaigns)
  const getPackageCampaignDiscount = (pkg: ListingPackage) => {
    // 1. Specific campaign for this package
    const specificCampaign = activeCampaigns.find(
      (c) =>
        c.targetPackageCode &&
        c.targetPackageCode.trim() !== '' &&
        c.targetPackageCode.toUpperCase() !== 'ALL' &&
        c.targetPackageCode.toUpperCase() === pkg.code.toUpperCase()
    );

    if (specificCampaign) {
      const discount = extractCampaignDiscount(specificCampaign, pkg.price.amountMinor);
      if (discount && discount.discountMinor > 0) {
        return {
          campaign: specificCampaign,
          ...discount,
        };
      }
    }

    // 2. Global campaign valid for all packages (targetPackageCode is null, empty or 'ALL')
    const globalCampaign = activeCampaigns.find(
      (c) =>
        !c.targetPackageCode ||
        c.targetPackageCode.trim() === '' ||
        c.targetPackageCode.toUpperCase() === 'ALL'
    );

    if (globalCampaign) {
      const discount = extractCampaignDiscount(globalCampaign, pkg.price.amountMinor);
      if (discount && discount.discountMinor > 0) {
        return {
          campaign: globalCampaign,
          ...discount,
        };
      }
    }

    return null;
  };

  // Helper to get normalized coupon data supporting both camelCase and PascalCase
  const getNormalizedCoupon = (ac?: CouponValidationResult | null) => {
    if (!ac?.valid || !ac.coupon) return null;
    const raw = ac.coupon as any;
    const code: string = raw.code || raw.Code || '';
    const name: string = raw.name || raw.Name || code || 'Kupon';
    const rawType = String(raw.discountType || raw.DiscountType || '').toUpperCase();
    const isPercentage = rawType.includes('PERCENT');
    const rawVal = Number(raw.discountValue ?? raw.DiscountValue ?? 0);
    const applicablePackageCode: string | null =
      raw.applicablePackageCode || raw.ApplicablePackageCode || null;

    const backendDiscountMinor =
      typeof ac.discountAmountMinor === 'number' && !isNaN(ac.discountAmountMinor)
        ? ac.discountAmountMinor
        : null;

    return {
      code,
      name,
      isPercentage,
      discountValue: rawVal,
      applicablePackageCode,
      backendDiscountMinor,
    };
  };

  // Helper to get coupon discount for a package
  const getPackageCouponDiscount = (pkg: ListingPackage, baseAmountMinor: number) => {
    const coupon = getNormalizedCoupon(appliedCoupon);
    if (!coupon) return null;

    const targetPkg = coupon.applicablePackageCode;
    if (
      targetPkg &&
      targetPkg.trim() !== '' &&
      targetPkg.toUpperCase() !== 'ALL' &&
      targetPkg.toUpperCase() !== pkg.code.toUpperCase()
    ) {
      return null;
    }

    if (coupon.isPercentage && coupon.discountValue > 0) {
      const discountMinor = Math.round(baseAmountMinor * (coupon.discountValue / 100));
      return {
        coupon,
        discountMinor: Math.min(baseAmountMinor, isNaN(discountMinor) ? 0 : discountMinor),
      };
    }

    // Fixed amount: check if discountValue is in minor (> 500) or TL
    const fixedMinor =
      coupon.backendDiscountMinor && coupon.backendDiscountMinor > 0
        ? coupon.backendDiscountMinor
        : coupon.discountValue > 500
        ? coupon.discountValue
        : coupon.discountValue * 100;

    const discountMinor = Math.min(baseAmountMinor, isNaN(fixedMinor) ? 0 : fixedMinor);
    return {
      coupon,
      discountMinor,
    };
  };

  // Helper to calculate discounted price for a package
  const getPackageDiscountedAmount = (pkg: ListingPackage) => {
    const campaignInfo = getPackageCampaignDiscount(pkg);
    const baseMinor = campaignInfo ? campaignInfo.campaignPriceMinor : pkg.price.amountMinor;
    const couponInfo = getPackageCouponDiscount(pkg, baseMinor);

    if (!campaignInfo && !couponInfo) {
      return null;
    }

    const finalMinor = couponInfo ? Math.max(0, baseMinor - couponInfo.discountMinor) : baseMinor;
    return isNaN(finalMinor) ? pkg.price.amountMinor : finalMinor;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 3 · Paket</Text>
        <Text style={[styles.title, { color: text }]}>Yayın paketini seçin</Text>
      </View>

      {error ? (
        <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
      ) : null}

      {/* Active Campaigns & Coupon Section */}
      <View style={styles.promotionsRow}>
        {activeCampaigns.length > 0 ? (
          <View style={[styles.campaignBanner, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
            <View style={styles.campaignHeader}>
              <Ionicons name="sparkles" size={18} color="#d97706" />
              <Text style={styles.campaignHeaderTitle}>Aktif Kampanyalar & Fırsatlar</Text>
            </View>
            <View style={styles.campaignList}>
              {activeCampaigns.map((camp) => (
                <View key={camp.code} style={styles.campaignItem}>
                  <View style={styles.campaignItemTop}>
                    <Text style={[styles.campaignName, { color: text }]}>{camp.name}</Text>
                    {camp.badgeText ? (
                      <View style={styles.campaignBadge}>
                        <Text style={styles.campaignBadgeText}>{camp.badgeText}</Text>
                      </View>
                    ) : null}
                  </View>
                  {camp.description ? (
                    <Text style={[styles.campaignDesc, { color: secondary }]}>{camp.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Coupon Code Input & Applied Card */}
        <View style={[styles.couponSection, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.couponHeaderRow}>
            <Ionicons name="ticket-outline" size={20} color={text} />
            <Text style={[styles.couponSectionTitle, { color: text }]}>İndirim Kuponu</Text>
          </View>

          {appliedCoupon?.valid && appliedCoupon.coupon ? (() => {
            const coupon = getNormalizedCoupon(appliedCoupon);
            if (!coupon) return null;
            const fixedTL = Math.round(
              (coupon.backendDiscountMinor && coupon.backendDiscountMinor > 0
                ? coupon.backendDiscountMinor
                : coupon.discountValue > 500
                ? coupon.discountValue
                : coupon.discountValue * 100) / 100
            );

            return (
              <View style={[styles.appliedBox, { backgroundColor: successLight, borderColor: success }]}>
                <View style={styles.appliedLeft}>
                  <Ionicons name="checkmark-circle" size={22} color={success} />
                  <View style={styles.appliedTextCol}>
                    <View style={styles.appliedCodeRow}>
                      <Text style={[styles.appliedCode, { color: text }]}>{coupon.code}</Text>
                      <View style={[styles.appliedDiscountBadge, { backgroundColor: success }]}>
                        <Text style={styles.appliedDiscountBadgeText}>
                          {coupon.isPercentage
                            ? `%${coupon.discountValue} İndirim`
                            : `${fixedTL} TL İndirim`}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.appliedName, { color: secondary }]}>
                      {coupon.name} başarıyla uygulandı
                    </Text>
                  </View>
                </View>
                {onRemoveCoupon ? (
                  <Pressable
                    onPress={onRemoveCoupon}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Kuponu kaldır"
                    style={({ pressed }) => [
                      styles.removeCouponBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons name="close-circle" size={20} color={errorColor} />
                    <Text style={[styles.removeCouponText, { color: errorColor }]}>Kaldır</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })() : (
            <View style={styles.couponInputWrapper}>
              <View style={styles.couponInputRow}>
                <TextInput
                  value={couponInput}
                  onChangeText={(val) => {
                    setCouponInput(val.toUpperCase());
                    if (couponError) setCouponError(null);
                  }}
                  placeholder="Kupon kodunu giriniz"
                  placeholderTextColor={muted}
                  autoCapitalize="characters"
                  style={[
                    styles.couponTextInput,
                    {
                      color: text,
                      borderColor: couponError ? errorColor : border,
                      backgroundColor: surface,
                    },
                  ]}
                  onSubmitEditing={() => handleApplyCoupon()}
                />
                <Pressable
                  onPress={() => handleApplyCoupon()}
                  disabled={couponLoading || !couponInput.trim()}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.applyCouponBtn,
                    {
                      backgroundColor: couponInput.trim() ? primary : border,
                      opacity: pressed || couponLoading ? 0.8 : 1,
                    },
                  ]}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.applyCouponBtnText}>Uygula</Text>
                  )}
                </Pressable>
              </View>
              {couponError ? (
                <View style={styles.couponErrorRow}>
                  <Ionicons name="alert-circle-outline" size={16} color={errorColor} />
                  <Text style={[styles.couponErrorText, { color: errorColor }]}>{couponError}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* Package Cards Grid */}
      <View style={styles.grid}>
        {packages.map((pkg) => {
          const on = selected === pkg.code;
          const discountedMinor = getPackageDiscountedAmount(pkg);
          const hasDiscount = discountedMinor != null && discountedMinor < pkg.price.amountMinor;
          const discountPercent =
            hasDiscount && pkg.price.amountMinor > 0
              ? Math.round(((pkg.price.amountMinor - discountedMinor) / pkg.price.amountMinor) * 100)
              : 0;

          return (
            <Pressable
              key={pkg.code}
              onPress={() => onSelect(pkg.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: on ? successLight : surface,
                  borderColor: on ? success : border,
                  borderWidth: on ? 2 : 1,
                  opacity: pressed ? 0.96 : 1,
                  ...Platform.select({
                    web: {
                      boxShadow: on
                        ? '0 12px 32px rgba(66, 214, 151, 0.16)'
                        : '0 8px 24px rgba(15, 23, 42, 0.04)',
                      cursor: 'pointer' as const,
                    },
                    default: {},
                  }),
                },
              ]}
            >
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.nameRow}>
                    <View style={styles.titleWithBadge}>
                      <Text style={[styles.name, { color: text }]}>{pkg.name}</Text>
                      {hasDiscount ? (
                        <View style={styles.discountBadge}>
                          <Ionicons name="flash" size={11} color="#16a34a" />
                          <Text style={styles.discountBadgeText}>
                            {discountPercent > 0 ? `%${discountPercent} İndirim` : 'İndirimli'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.tag, { color: secondary }]}>{pkg.tagline}</Text>
                  </View>
                  {on ? (
                    <Ionicons name="checkmark-circle" size={24} color={success} />
                  ) : (
                    <View style={[styles.radio, { borderColor: border }]} />
                  )}
                </View>

                <View style={styles.features}>
                  {pkg.features.map((f) => (
                    <View key={f.id} style={styles.feature}>
                      <Ionicons
                        name={
                          f.included
                            ? (f.icon as keyof typeof Ionicons.glyphMap)
                            : 'close-outline'
                        }
                        size={17}
                        color={f.included ? success : muted}
                        style={{ opacity: f.included ? 1 : 0.6 }}
                      />
                      <Text
                        style={[
                          styles.featureLabel,
                          {
                            color: f.included ? text : muted,
                            opacity: f.included ? 1 : 0.6,
                            textDecorationLine: f.included ? 'none' : 'line-through',
                          },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: border }]}>
                <View style={styles.priceBox}>
                  {hasDiscount ? (
                    <View style={styles.discountedPriceContainer}>
                      <Text style={[styles.originalPriceStrikethrough, { color: muted }]}>
                        {formatMoney(pkg.price)}
                      </Text>
                      <Text style={[styles.price, { color: success }]}>
                        {formatMoney({
                          amountMinor: discountedMinor,
                          currency: pkg.price.currency,
                        })}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.price, { color: text }]}>
                      {formatMoney(pkg.price)}
                    </Text>
                  )}
                  <View style={[styles.periodBadge, { backgroundColor: border }]}>
                    <Text style={[styles.period, { color: secondary }]}>
                      {pkg.durationDays} gün
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setPreviewPkg(pkg);
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`${pkg.name} nasıl görünür?`}
                  style={({ pressed }) => [
                    styles.howItLooksBtn,
                    {
                      borderColor: primary,
                      backgroundColor: pressed
                        ? 'rgba(239, 68, 68, 0.16)'
                        : 'rgba(239, 68, 68, 0.08)',
                    },
                  ]}
                >
                  <Ionicons name="eye-outline" size={16} color={primary} />
                  <Text style={[styles.howItLooksText, { color: primary }]}>
                    Nasıl Görünür?
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Package Order Summary */}
      {selectedPkg ? (() => {
        const campaignInfo = getPackageCampaignDiscount(selectedPkg);
        const baseMinor = campaignInfo ? campaignInfo.campaignPriceMinor : selectedPkg.price.amountMinor;
        const couponInfo = getPackageCouponDiscount(selectedPkg, baseMinor);
        const discountedMinor = getPackageDiscountedAmount(selectedPkg);
        const finalAmountMinor =
          discountedMinor != null && !isNaN(discountedMinor)
            ? discountedMinor
            : selectedPkg.price.amountMinor;
        const totalDiscountMinor = Math.max(0, selectedPkg.price.amountMinor - finalAmountMinor);

        return (
          <View style={[styles.summaryBox, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.summaryTitle, { color: text }]}>Sipariş Özeti</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondary }]}>Seçilen Paket</Text>
              <Text style={[styles.summaryVal, { color: text }]}>{selectedPkg.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondary }]}>Paket Fiyatı</Text>
              <Text style={[styles.summaryVal, { color: text }]}>{formatMoney(selectedPkg.price)}</Text>
            </View>

            {campaignInfo && campaignInfo.discountMinor > 0 ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCouponBadgeRow}>
                  <Ionicons name="sparkles" size={15} color={success} style={styles.summaryBadgeIcon} />
                  <Text style={[styles.summaryLabel, { color: success, fontWeight: '600' }]}>
                    Kampanya İndirimi
                    {campaignInfo.campaign.name ? (
                      <Text style={[styles.summarySubLabel, { color: success }]}>
                        {` (${campaignInfo.campaign.name})`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <Text style={[styles.summaryVal, { color: success, fontWeight: '700' }]}>
                  -{formatMoney({ amountMinor: campaignInfo.discountMinor, currency: selectedPkg.price.currency })}
                </Text>
              </View>
            ) : null}

            {couponInfo && couponInfo.discountMinor > 0 ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCouponBadgeRow}>
                  <Ionicons name="ticket" size={15} color={success} style={styles.summaryBadgeIcon} />
                  <Text style={[styles.summaryLabel, { color: success, fontWeight: '600' }]}>
                    Kupon İndirimi
                    {couponInfo.coupon.code ? (
                      <Text style={[styles.summarySubLabel, { color: success }]}>
                        {` (${couponInfo.coupon.code})`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <Text style={[styles.summaryVal, { color: success, fontWeight: '700' }]}>
                  -{formatMoney({ amountMinor: couponInfo.discountMinor, currency: selectedPkg.price.currency })}
                </Text>
              </View>
            ) : null}

            {!campaignInfo && !couponInfo && totalDiscountMinor > 0 ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCouponBadgeRow}>
                  <Ionicons name="pricetag" size={15} color={success} style={styles.summaryBadgeIcon} />
                  <Text style={[styles.summaryLabel, { color: success, fontWeight: '600' }]}>
                    İndirim Tutarı
                  </Text>
                </View>
                <Text style={[styles.summaryVal, { color: success, fontWeight: '700' }]}>
                  -{formatMoney({ amountMinor: totalDiscountMinor, currency: selectedPkg.price.currency })}
                </Text>
              </View>
            ) : null}

            <View style={[styles.summaryDivider, { backgroundColor: border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: text }]}>Toplam Ödenecek</Text>
              <Text style={[styles.summaryTotalVal, { color: success }]}>
                {finalAmountMinor === 0
                  ? 'ÜCRETSİZ'
                  : formatMoney({
                    amountMinor: finalAmountMinor,
                    currency: selectedPkg.price.currency,
                  })}
              </Text>
            </View>
          </View>
        );
      })() : null}

      {draft && previewPkg ? (
        <PackagePreviewModal
          visible={previewPkg !== null}
          pkg={previewPkg}
          draft={draft}
          onClose={() => setPreviewPkg(null)}
          onSelectPackage={(code) => {
            onSelect(code);
            setPreviewPkg(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  intro: { gap: 6 },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2 },
  error: { ...Typography.small },

  /* Promotions Row */
  promotionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    alignItems: 'stretch',
  },

  /* Campaigns Banner */
  campaignBanner: {
    flex: 1,
    flexBasis: 260,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
    justifyContent: 'center',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campaignHeaderTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: '#b45309',
  },
  campaignList: {
    gap: 6,
  },
  campaignItem: {
    gap: 2,
  },
  campaignItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  campaignName: {
    ...Typography.small,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  campaignBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  campaignBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  campaignDesc: {
    ...Typography.caption,
  },

  /* Coupon Section */
  couponSection: {
    flex: 1,
    flexBasis: 260,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
    justifyContent: 'center',
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponSectionTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  couponInputWrapper: {
    gap: 8,
    width: '100%',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    width: '100%',
  },
  couponTextInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  applyCouponBtn: {
    flexShrink: 0,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  couponErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  couponErrorText: {
    ...Typography.small,
  },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  appliedTextCol: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  appliedCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  appliedCode: {
    fontWeight: '800',
    fontSize: 15,
  },
  appliedDiscountBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  appliedDiscountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  appliedName: {
    fontSize: 12,
  },
  removeCouponBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Grid & Cards */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 260,
    borderRadius: 20,
    padding: Spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
  },
  nameRow: {
    flex: 1,
    gap: 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    ...Typography.h3,
    fontWeight: '700',
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  highlightBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 2,
  },
  tag: {
    ...Typography.small,
    marginTop: 2,
  },
  features: {
    gap: 10,
    marginTop: Spacing.md,
    flex: 1,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  featureLabel: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  discountedPriceContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  originalPriceStrikethrough: {
    fontSize: 13,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  price: {
    ...Typography.h2,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  period: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  howItLooksBtn: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease-in-out',
      },
      default: {},
    }),
  },
  howItLooksText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Order Summary */
  summaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
    marginTop: Spacing.sm,
  },
  summaryTitle: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    ...Typography.body,
    flex: 1,
    minWidth: 0,
  },
  summaryVal: {
    ...Typography.body,
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'right',
  },
  summaryCouponBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  summaryBadgeIcon: {
    flexShrink: 0,
  },
  summarySubLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryTotalLabel: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    minWidth: 0,
  },
  summaryTotalVal: {
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 0,
    textAlign: 'right',
  },
});

