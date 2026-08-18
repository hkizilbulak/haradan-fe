/**
 * Canlı Arama ve Filtreleme Self-Test.
 * npm run selftest:live-search
 */
import {
  filterAndRankAdverts,
  normalizeSearchText,
} from '../services/adverts/filterAdverts';
import type { CatalogProductCard } from '../types';

let failed = 0;
let passed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

// 1. Türkçe Karakter Normalizasyon Testleri
console.log('--- Türkçe Karakter Normalizasyon Testleri ---');
assertEqual(normalizeSearchText('İSTANBUL'), 'istanbul', 'İSTANBUL -> istanbul');
assertEqual(normalizeSearchText('Isparta'), 'isparta', 'Isparta -> isparta');
assertEqual(normalizeSearchText('Şampiyon Kısrak'), 'sampiyon kisrak', 'Şampiyon Kısrak -> sampiyon kisrak');
assertEqual(normalizeSearchText('Çanakkale Boğazı'), 'canakkale bogazi', 'Çanakkale Boğazı -> canakkale bogazi');
assertEqual(normalizeSearchText('Ağrı Dağı'), 'agri dagi', 'Ağrı Dağı -> agri dagi');
assertEqual(normalizeSearchText('Özel Üretim'), 'ozel uretim', 'Özel Üretim -> ozel uretim');
assertEqual(normalizeSearchText('   '), '', 'Whitespace -> empty string');
assertEqual(normalizeSearchText(null), '', 'Null -> empty string');

// Mock Veri Seti
const mockAdverts: CatalogProductCard[] = [
  {
    id: 'adv-1',
    title: '2021 Doğumlu Bold Pilot Oğlu',
    publishedAt: '2026-08-15T10:00:00Z',
    price: { amountMinor: 150000000, currency: 'TRY' },
    categoryId: 'cat-race',
    provinceId: 'prov-34', // İstanbul
    districtId: 'dist-sariyer',
    horseId: 'h-1',
    cover: { assetId: 'm1', displayOrder: 0, isCover: true, publicUrl: 'http://example.com/1.jpg' },
    isFavorite: false,
    isUrgent: true,
    isFeatured: false,
    rating: 0,
    reviewCount: 0,
    viewCount: 120,
    oldPrice: null,
    available: null,
    brand: 'Thoroughbred',
  },
  {
    id: 'adv-2',
    title: 'Şampiyon Kanı Safkan Arap Aygırı',
    publishedAt: '2026-08-14T10:00:00Z',
    price: { amountMinor: 250000000, currency: 'TRY' },
    categoryId: 'cat-stallion',
    provinceId: 'prov-16', // Bursa
    districtId: 'dist-nilufer',
    horseId: 'h-2',
    cover: { assetId: 'm2', displayOrder: 0, isCover: true, publicUrl: 'http://example.com/2.jpg' },
    isFavorite: true,
    isUrgent: false,
    isFeatured: true,
    rating: 0,
    reviewCount: 0,
    viewCount: 450,
    oldPrice: null,
    available: null,
    brand: 'Arabian',
  },
  {
    id: 'adv-3',
    title: 'Eğitimli Pony Binek Atı Çocuklar İçin',
    publishedAt: '2026-08-10T10:00:00Z',
    price: { amountMinor: 80000000, currency: 'TRY' },
    categoryId: 'cat-pony',
    provinceId: 'prov-06', // Ankara
    districtId: 'dist-cankaya',
    horseId: 'h-3',
    cover: null,
    isFavorite: false,
    isUrgent: false,
    isFeatured: false,
    rating: 0,
    reviewCount: 0,
    viewCount: 80,
    oldPrice: null,
    available: null,
    brand: 'Pony',
  },
];

const mockResolver = (adv: CatalogProductCard) => {
  const provinces: Record<string, string> = {
    'prov-34': 'İstanbul',
    'prov-16': 'Bursa',
    'prov-06': 'Ankara',
  };
  const districts: Record<string, string> = {
    'dist-sariyer': 'Sarıyer',
    'dist-nilufer': 'Nilüfer',
    'dist-cankaya': 'Çankaya',
  };
  const categories: Record<string, string> = {
    'cat-race': 'Yarış Atı',
    'cat-stallion': 'Aygır',
    'cat-pony': 'Pony',
  };
  return {
    provinceName: provinces[adv.provinceId] ?? null,
    districtName: districts[adv.districtId] ?? null,
    categoryName: categories[adv.categoryId] ?? null,
  };
};

// 2. Canlı Filtreleme ve Sıralama Testleri
console.log('\n--- Canlı Filtreleme ve Arama Testleri ---');

// Başlık araması
const rTitle = filterAndRankAdverts(mockAdverts, 'bold pilot', { resolveExtra: mockResolver });
assertEqual(rTitle.length, 1, 'Search "bold pilot" finds 1 result');
assertEqual(rTitle[0]?.id, 'adv-1', 'First match is adv-1');

// Türkçe karakterli ve karaktersiz arama
const rArap1 = filterAndRankAdverts(mockAdverts, 'şampiyon', { resolveExtra: mockResolver });
assertEqual(rArap1.length, 1, 'Search "şampiyon" with Turkish chars finds adv-2');
assertEqual(rArap1[0]?.id, 'adv-2', 'First match is adv-2');

const rArap2 = filterAndRankAdverts(mockAdverts, 'sampiyon', { resolveExtra: mockResolver });
assertEqual(rArap2.length, 1, 'Search "sampiyon" with ASCII chars finds adv-2');
assertEqual(rArap2[0]?.id, 'adv-2', 'First match is adv-2');

// Irk (brand) araması
const rBreed = filterAndRankAdverts(mockAdverts, 'Thoroughbred', { resolveExtra: mockResolver });
assertEqual(rBreed.length, 1, 'Search breed "Thoroughbred" finds adv-1');
assertEqual(rBreed[0]?.id, 'adv-1', 'Breed match is adv-1');

// İl / Konum araması
const rLoc = filterAndRankAdverts(mockAdverts, 'istanbul', { resolveExtra: mockResolver });
assertEqual(rLoc.length, 1, 'Search location "istanbul" finds adv-1');

const rLoc2 = filterAndRankAdverts(mockAdverts, 'nilufer', { resolveExtra: mockResolver });
assertEqual(rLoc2.length, 1, 'Search district "nilufer" finds adv-2');

// Kategori araması
const rCat = filterAndRankAdverts(mockAdverts, 'aygir', { resolveExtra: mockResolver });
assertEqual(rCat.length, 1, 'Search category "aygir" finds adv-2');

// Çoklu kelime araması
const rMulti = filterAndRankAdverts(mockAdverts, 'safkan bursa', { resolveExtra: mockResolver });
assertEqual(rMulti.length, 1, 'Multi-word search "safkan bursa" finds adv-2');

// Boş veya eşleşmeyen arama
const rEmpty = filterAndRankAdverts(mockAdverts, '', { resolveExtra: mockResolver });
assertEqual(rEmpty.length, 0, 'Empty search returns empty list');

const rWhitespace = filterAndRankAdverts(mockAdverts, '   ', { resolveExtra: mockResolver });
assertEqual(rWhitespace.length, 0, 'Whitespace search returns empty list');

const rNoMatch = filterAndRankAdverts(mockAdverts, 'uzay gemisi', { resolveExtra: mockResolver });
assertEqual(rNoMatch.length, 0, 'Non-matching search returns empty list');

// Limit kontrolü
const rLimit = filterAndRankAdverts(mockAdverts, 'a', { limit: 2, resolveExtra: mockResolver });
assert(rLimit.length <= 2, 'Limit 2 restricts results to at most 2 items');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
