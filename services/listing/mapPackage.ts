import type { ListingPackage, ListingPackageFeature } from '@/types/listing';
import type { Money } from '@/types/money';

export type PublicPackage = {
  code: string;
  displayName: string;
  description?: string | null;
  badgeText?: string | null;
  benefits: string[];
  displayPrice?: Money | null;
  defaultDurationDays?: number | null;
  allowsUrgent: boolean;
  showcaseEligible: boolean;
  featuredDays?: number | null;
  searchPriority: number;
  sortOrder: number;
};

export type PublicPackageListResponse = { items: PublicPackage[] };

/** Benefit encoding: "in|icon|label" | "out|icon|label" | plain label (included). */
function parseBenefit(raw: string, index: number, code: string): ListingPackageFeature {
  const value = raw.trim();
  const parts = value.split('|');
  if (parts.length >= 3 && (parts[0] === 'in' || parts[0] === 'out')) {
    const included = parts[0] === 'in';
    const icon = parts[1] || 'checkmark-outline';
    const label = parts.slice(2).join('|').trim() || value;
    return {
      id: `${code}-${index}`,
      label,
      icon,
      included,
    };
  }
  return {
    id: `${code}-${index}`,
    label: value,
    icon: 'checkmark-outline',
    included: true,
  };
}

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function mapPublicPackage(pkg: PublicPackage): ListingPackage {
  const tagline =
    (pkg.description ? stripHtml(pkg.description) : '') ||
    (pkg.badgeText ?? '').trim();
  return {
    code: pkg.code,
    name: pkg.displayName,
    tagline,
    price: pkg.displayPrice ?? { amountMinor: 0, currency: 'TRY' },
    durationDays: pkg.defaultDurationDays ?? 30,
    highlighted: Boolean((pkg.badgeText ?? '').trim()),
    features: (pkg.benefits ?? []).map((label, index) =>
      parseBenefit(label, index, pkg.code)
    ),
  };
}
