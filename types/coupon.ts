export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PublicCoupon {
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
}

export interface PublicCampaign {
  code: string;
  name: string;
  title?: string | null;
  description?: string | null;
  badgeText?: string | null;
  targetPackageCode?: string | null;
  displayOriginalPriceAmountMinor?: number | null;
  displayCampaignPriceAmountMinor?: number | null;
  currencyCode?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

export interface CouponValidationDetails {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number | null;
  usesCount?: number;
  maxUsesPerUser?: number;
  minSpendAmountMinor?: number | null;
  applicablePackageCode?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  isActive?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: CouponValidationDetails;
  discountAmountMinor: number;
  finalAmountMinor: number;
  message?: string;
}
