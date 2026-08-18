import type { CatalogProductCard } from '@/types';

/**
 * Türkçe karakter uyumlu normalizasyon.
 * Hem Türkçe yerel kurallarını hem de aksan/harf varyasyonlarını (ı/i, ğ/g, vb.) kapsar.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export type AdvertFilterExtraInfo = {
  provinceName?: string | null;
  districtName?: string | null;
  categoryName?: string | null;
};

export type AdvertFilterResolver = (
  advert: CatalogProductCard
) => AdvertFilterExtraInfo | undefined;

export type FilterAdvertsOptions = {
  limit?: number;
  resolveExtra?: AdvertFilterResolver;
};

export type FilteredAdvertResult = {
  advert: CatalogProductCard;
  score: number;
  extra?: AdvertFilterExtraInfo;
};

/**
 * Canlı arama için akıllı puanlama ve filtreleme algoritması (SOLID - SRP).
 */
export function filterAndRankAdverts(
  adverts: CatalogProductCard[],
  rawQuery: string,
  options: FilterAdvertsOptions = {}
): CatalogProductCard[] {
  const query = normalizeSearchText(rawQuery);
  if (!query) return [];

  const queryWords = query.split(/\s+/).filter(Boolean);
  const limit = options.limit ?? 8;
  const scored: FilteredAdvertResult[] = [];

  for (const advert of adverts) {
    const normTitle = normalizeSearchText(advert.title);
    const normBrand = normalizeSearchText(advert.brand);
    const extra = options.resolveExtra?.(advert);
    const normProvince = normalizeSearchText(extra?.provinceName);
    const normDistrict = normalizeSearchText(extra?.districtName);
    const normCategory = normalizeSearchText(extra?.categoryName);

    let score = 0;

    // Tam eşleşme veya başlık başlangıcı
    if (normTitle === query) {
      score += 150;
    } else if (normTitle.startsWith(query)) {
      score += 100;
    } else if (normTitle.includes(query)) {
      score += 50;
    }

    // Kelime başlangıcı kontrolü (örn. "Bold Pilot" -> "pil" araması)
    const titleWords = normTitle.split(/\s+/);
    for (const tw of titleWords) {
      if (tw.startsWith(query)) {
        score += 40;
        break;
      }
    }

    // Irk / Marka eşleşmesi
    if (normBrand) {
      if (normBrand.startsWith(query)) {
        score += 45;
      } else if (normBrand.includes(query)) {
        score += 25;
      }
    }

    // İl / İlçe eşleşmesi
    if (normProvince && normProvince.includes(query)) {
      score += 20;
    }
    if (normDistrict && normDistrict.includes(query)) {
      score += 15;
    }

    // Kategori eşleşmesi
    if (normCategory && normCategory.includes(query)) {
      score += 15;
    }

    // Çoklu kelime desteği (tüm aranan kelimeler bulunuyor mu?)
    if (queryWords.length > 1) {
      const combined = `${normTitle} ${normBrand} ${normProvince} ${normDistrict} ${normCategory}`;
      const allWordsMatch = queryWords.every((w) => combined.includes(w));
      if (allWordsMatch) {
        score += 35;
      }
    }

    // Ek boost: Acil / Vitrin ilanları
    if (score > 0) {
      if (advert.isUrgent) score += 5;
      if (advert.isFeatured) score += 3;
      scored.push({ advert, score, extra });
    }
  }

  // Puan azalan, sonra tarih azalan
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.advert.isUrgent !== b.advert.isUrgent) {
      return a.advert.isUrgent ? -1 : 1;
    }
    return a.advert.publishedAt < b.advert.publishedAt ? 1 : -1;
  });

  return scored.slice(0, limit).map((s) => s.advert);
}
