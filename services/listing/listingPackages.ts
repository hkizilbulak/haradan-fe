import type { ListingPackage } from '@/types/listing';

/** Katalog fiyatları — BE gelince GET /v1/listing-packages ile değişir. */
export const LISTING_PACKAGES: ListingPackage[] = [
  {
    code: 'STANDARD',
    name: 'Standart',
    tagline: 'Temel yayın',
    price: { amountMinor: 25_000, currency: 'TRY' },
    durationDays: 30,
    highlighted: false,
    features: [
      { id: 'duration', label: '30 gün yayın', icon: 'time-outline', included: true },
      { id: 'photos', label: '5 görsel + kapak', icon: 'images-outline', included: true },
      { id: 'urgent', label: 'Acil ilan rozeti', icon: 'flash-outline', included: false },
      { id: 'featured', label: 'Öne çıkan ilan', icon: 'star-outline', included: false },
      { id: 'social', label: 'Sosyal medyada yayın', icon: 'share-social-outline', included: false },
      { id: 'showcase', label: 'Anasayfa vitrini', icon: 'trophy-outline', included: false },
      { id: 'support', label: 'Öncelikli destek', icon: 'headset-outline', included: false },
    ],
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    tagline: 'Daha fazla görünürlük',
    price: { amountMinor: 65_000, currency: 'TRY' },
    durationDays: 45,
    highlighted: true,
    features: [
      { id: 'duration', label: '45 gün yayın', icon: 'time-outline', included: true },
      { id: 'photos', label: '5 görsel + kapak', icon: 'images-outline', included: true },
      { id: 'urgent', label: 'Acil ilan rozeti', icon: 'flash-outline', included: true },
      { id: 'featured', label: 'Öne çıkan ilan · 7 gün', icon: 'star-outline', included: true },
      { id: 'social', label: 'Sosyal medya · 1 platform', icon: 'share-social-outline', included: true },
      { id: 'showcase', label: 'Anasayfa vitrini', icon: 'trophy-outline', included: false },
      { id: 'support', label: 'Öncelikli destek', icon: 'headset-outline', included: false },
    ],
  },
  {
    code: 'ULTIMATE',
    name: 'Ultimate',
    tagline: 'Maksimum erişim',
    price: { amountMinor: 125_000, currency: 'TRY' },
    durationDays: 60,
    highlighted: false,
    features: [
      { id: 'duration', label: '60 gün yayın', icon: 'time-outline', included: true },
      { id: 'photos', label: '5 görsel + kapak', icon: 'images-outline', included: true },
      { id: 'urgent', label: 'Acil ilan rozeti', icon: 'flash-outline', included: true },
      { id: 'featured', label: 'Öne çıkan ilan · 30 gün', icon: 'star-outline', included: true },
      { id: 'social', label: 'Instagram, Facebook, X', icon: 'share-social-outline', included: true },
      { id: 'showcase', label: 'Anasayfa vitrini', icon: 'trophy-outline', included: true },
      { id: 'support', label: 'Öncelikli destek', icon: 'headset-outline', included: true },
    ],
  },
];
