import type { Money } from './money';
import type { PublishedAdvertCard } from './advert';

/**
 * Ana sayfa / katalog kartı için UI zenginleştirmesi.
 * BE `PublishedAdvertCard` alanları korunur; rating/stok/eski fiyat
 * şimdilik mock — API gelince mapper ile doldurulur.
 */
export type CatalogProductCard = PublishedAdvertCard & {
  rating: number;
  reviewCount: number;
  viewCount: number;
  oldPrice: Money | null;
  available: number | null;
  brand: string | null;
};

export type BrandItem = {
  id: string;
  name: string;
  logoUrl: string;
};

export type BlogVideoItem = {
  id: string;
  title: string;
  duration: string;
  coverUrl: string;
  href?: string;
  tag?: string;
};

export type SalePromo = {
  discountLabel: string;
  title: string;
  code: string;
  imageUrl: string;
};

export type MacPromo = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl: string;
  backgroundUrl?: string;
};
