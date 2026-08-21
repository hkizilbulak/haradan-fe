/** Fiyat — kullanıcı TL girer; karşılaştırma amountMinor (kuruş). */

export function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function formatTlInput(n: number | null): string {
  if (n == null) return '';
  return n.toLocaleString('tr-TR');
}

export function parseProvinceParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeProvinceParam(ids: string[]): string | null {
  if (ids.length === 0) return null;
  return ids.join(',');
}

export function parseTlParam(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export function tlToMinor(tl: number): number {
  return Math.round(tl * 100);
}

export function matchesPrice(
  amountMinor: number,
  minTl: number | null,
  maxTl: number | null
): boolean {
  if (minTl != null && amountMinor < tlToMinor(minTl)) return false;
  if (maxTl != null && amountMinor > tlToMinor(maxTl)) return false;
  return true;
}

export function priceHint(minTl: number | null, maxTl: number | null): string | null {
  if (minTl == null && maxTl == null) return null;
  if (minTl != null && maxTl != null) {
    return `${formatTlInput(minTl)} – ${formatTlInput(maxTl)} ₺`;
  }
  if (minTl != null) return `${formatTlInput(minTl)} ₺+`;
  return `${formatTlInput(maxTl)} ₺’ye kadar`;
}

export type ListingPeriodFilter = '24h' | '3d' | '7d' | '30d';

export const PERIOD_OPTIONS: { id: ListingPeriodFilter; label: string; hours: number }[] = [
  { id: '24h', label: 'Son 24 saat', hours: 24 },
  { id: '3d', label: 'Son 3 gün', hours: 72 },
  { id: '7d', label: 'Son 7 gün', hours: 168 },
  { id: '30d', label: 'Son 30 gün', hours: 720 },
];

export type PansiyonFacilityKey =
  | 'grassPaddock'
  | 'sandPaddock'
  | 'stallionPaddock'
  | 'vet'
  | 'farrier'
  | 'foalingBarn';

export const PANSIYON_FACILITY_OPTIONS: { key: PansiyonFacilityKey; label: string }[] = [
  { key: 'grassPaddock', label: 'Çim Padok' },
  { key: 'sandPaddock', label: 'Kum Padok' },
  { key: 'stallionPaddock', label: 'Aygır Padoğu' },
  { key: 'vet', label: 'Veteriner' },
  { key: 'farrier', label: 'Nalbant' },
  { key: 'foalingBarn', label: 'Doğumhane' },
];

export const STUD_BREED_OPTIONS = ['Arap', 'İngiliz'];

export const STUD_AGE_OPTIONS = ['0', '1', '1.5', '2', '3', '4', '5+'];

export const COAT_COLOR_OPTIONS = [
  'Doru',
  'Al',
  'Kır',
  'Beyaz',
  'Yağız',
  'Kula',
  'Boz',
];

export const HORSE_BREED_OPTIONS = [
  'İngiliz (Thoroughbred)',
  'Safkan Arap',
  'Warmblood / Spor Atı',
  'Konkur / Engel Atlama',
  'Rahvan',
  'Pony / Midilli',
  'Haflinger',
];

export const HORSE_AGE_OPTIONS = [
  'Tay (0-1 Yaş)',
  '2 Yaş',
  '3 Yaş',
  '4 Yaş',
  '5+ Yaş',
];

export const HORSE_GENDER_OPTIONS = ['Erkek', 'Dişi', 'İğdiş'];

export function parseArrayParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeArrayParam(items: string[]): string | null {
  if (!items || items.length === 0) return null;
  return items.join(',');
}

export function matchesDatePeriod(
  publishedAt: string | null | undefined,
  period: ListingPeriodFilter | string | null | undefined
): boolean {
  if (!period) return true;
  if (!publishedAt) return false;
  const opt = PERIOD_OPTIONS.find((p) => p.id === period);
  if (!opt) return true;
  const pubTime = new Date(publishedAt).getTime();
  if (Number.isNaN(pubTime)) return true;
  const cutoff = Date.now() - opt.hours * 3600 * 1000;
  return pubTime >= cutoff;
}

export function periodLabel(period: string | null | undefined): string | null {
  if (!period) return null;
  return PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? null;
}

export function isHorseCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'satilik-atlar' ||
    s === 'cat-satilik-atlar' ||
    s.includes('satilik') ||
    s.includes('yaris-ati') ||
    s.includes('yaris') ||
    s.includes('yarış') ||
    s.includes('kisrak') ||
    s.includes('kısrak') ||
    s.includes('damizlik') ||
    s.includes('damızlık') ||
    s.includes('aygir') ||
    s.includes('aygır') ||
    s.includes('binek') ||
    s.includes('binek-ati') ||
    s.includes('pony') ||
    s.includes('midilli') ||
    s.includes('tay') ||
    s.includes('konkur')
  ) && !s.includes('asim') && !s.includes('aşım');
}

export function isPansiyonCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'pansiyon-haralar' ||
    s === 'cat-pansiyon' ||
    s.includes('pansiyon') ||
    s.includes('hara')
  );
}

export function isTransportCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'at-nakliyesi' ||
    s === 'cat-nakliye' ||
    s.includes('nakliye') ||
    s.includes('tasima') ||
    s.includes('taşıma') ||
    s.includes('transport')
  );
}

export function isFarrierCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'nalbantlar' ||
    s === 'cat-nalbant' ||
    s.includes('nalbant') ||
    s.includes('farrier')
  );
}

export function isStudCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'asim-hizmetleri' ||
    s === 'arap-aygir' ||
    s === 'ingiliz-aygir' ||
    s === 'cat-asim' ||
    s === 'cat-arap-aygir' ||
    s === 'cat-ingiliz-aygir' ||
    s.includes('aygir') ||
    s.includes('aygır') ||
    s.includes('asim') ||
    s.includes('aşım')
  );
}

export function matchHorseGender(
  card: { title?: string; brand?: string | null; categoryId?: string },
  selectedGenders?: string[] | null
): boolean {
  if (!selectedGenders || selectedGenders.length === 0) return true;
  const rawTitle = (card.title ?? '').toLocaleLowerCase('tr');
  const rawBrand = (card.brand ?? '').toLocaleLowerCase('tr');
  const catId = (card.categoryId ?? '').toLocaleLowerCase('tr');
  const text = `${rawTitle} ${rawBrand} ${catId}`;

  const isFemale =
    catId === 'cat-kisrak' ||
    text.includes('kısrak') ||
    text.includes('kisrak') ||
    text.includes('dişi') ||
    text.includes('disi') ||
    text.includes('mare') ||
    text.includes('filly') ||
    text.includes('dişi tay');

  const isGelding =
    catId === 'cat-pony' ||
    text.includes('iğdiş') ||
    text.includes('igdis') ||
    text.includes('gelding') ||
    text.includes('pony') ||
    text.includes('midilli');

  const isMale =
    !isFemale &&
    (catId === 'cat-aygir' ||
      catId === 'cat-arap-aygir' ||
      catId === 'cat-ingiliz-aygir' ||
      catId === 'cat-yaris-ati' ||
      text.includes('aygır') ||
      text.includes('aygir') ||
      text.includes('erkek') ||
      text.includes('stallion') ||
      text.includes('colt') ||
      text.includes('erkek tay') ||
      !isGelding);

  return selectedGenders.some((g) => {
    const norm = g.trim().toLocaleLowerCase('tr');
    if (norm === 'erkek') return isMale;
    if (norm === 'dişi' || norm === 'disi') return isFemale;
    if (norm === 'iğdiş' || norm === 'igdis') return isGelding;
    return text.includes(norm);
  });
}

export function matchHorseBreed(
  card: { title?: string; brand?: string | null; categoryId?: string },
  selectedBreeds?: string[] | null
): boolean {
  if (!selectedBreeds || selectedBreeds.length === 0) return true;
  const rawTitle = (card.title ?? '').toLocaleLowerCase('tr');
  const rawBrand = (card.brand ?? '').toLocaleLowerCase('tr');
  const catId = (card.categoryId ?? '').toLocaleLowerCase('tr');
  const text = `${rawTitle} ${rawBrand} ${catId}`;

  return selectedBreeds.some((b) => {
    const norm = b.trim().toLocaleLowerCase('tr');
    if (norm.includes('ingiliz') || norm.includes('thoroughbred')) {
      return (
        text.includes('ingiliz') ||
        text.includes('thoroughbred') ||
        text.includes('thorough') ||
        catId === 'cat-ingiliz-aygir'
      );
    }
    if (norm.includes('arap') || norm.includes('arabian')) {
      return (
        text.includes('arap') ||
        text.includes('arabian') ||
        text.includes('arab') ||
        catId === 'cat-arap-aygir'
      );
    }
    if (norm.includes('warmblood') || norm.includes('spor')) {
      return (
        text.includes('warmblood') ||
        text.includes('spor') ||
        text.includes('sport') ||
        text.includes('dressaj') ||
        text.includes('dresaj')
      );
    }
    if (norm.includes('konkur') || norm.includes('engel')) {
      return (
        text.includes('konkur') ||
        text.includes('engel') ||
        text.includes('jumping') ||
        text.includes('atlama')
      );
    }
    if (norm.includes('rahvan')) {
      return text.includes('rahvan');
    }
    if (norm.includes('pony') || norm.includes('midilli')) {
      return (
        text.includes('pony') ||
        text.includes('midilli') ||
        text.includes('shetland') ||
        catId === 'cat-pony'
      );
    }
    if (norm.includes('haflinger')) {
      return text.includes('haflinger');
    }
    return text.includes(norm);
  });
}

export function matchHorseAge(
  card: { title?: string; brand?: string | null },
  selectedAges?: string[] | null
): boolean {
  if (!selectedAges || selectedAges.length === 0) return true;
  const text = (card.title ?? '').toLocaleLowerCase('tr');

  // Extract age number from title if exists: e.g. "3 yaş", "5 yaş", "7 yaşlı", "1.5 yaş"
  const ageMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:yaş|yas|ya)/);
  const parsedAge = ageMatch ? parseFloat(ageMatch[1].replace(',', '.')) : null;

  return selectedAges.some((ageOption) => {
    const norm = ageOption.trim().toLocaleLowerCase('tr');

    // 5+ Yaş
    if (norm.includes('5+') || norm === '5+') {
      if (parsedAge != null && parsedAge >= 5) return true;
      return (
        text.includes('5+') ||
        text.includes('5 ya') ||
        text.includes('6 ya') ||
        text.includes('7 ya') ||
        text.includes('8 ya') ||
        text.includes('9 ya') ||
        text.includes('10 ya')
      );
    }

    // Tay (0-1 Yaş) or 0 or 1
    if (
      norm.includes('tay') ||
      norm === '0' ||
      norm === '1' ||
      norm.includes('0-1')
    ) {
      if (parsedAge != null && parsedAge <= 1.5) return true;
      return (
        text.includes('tay') ||
        text.includes('0 yaş') ||
        text.includes('0 yas') ||
        text.includes('1 yaş') ||
        text.includes('1 yas') ||
        text.includes('0-1')
      );
    }

    // 1.5 Yaş
    if (norm === '1.5' || norm === '1,5') {
      if (parsedAge != null && Math.abs(parsedAge - 1.5) < 0.3) return true;
      return (
        text.includes('1.5') ||
        text.includes('1,5') ||
        text.includes('1 bucuk') ||
        text.includes('1 buçuk')
      );
    }

    // Specific number: e.g. "2 Yaş", "3 Yaş", "4 Yaş", "2", "3", "4"
    const targetNumMatch = norm.match(/(\d+)/);
    if (targetNumMatch) {
      const targetNum = parseInt(targetNumMatch[1], 10);
      if (parsedAge != null && Math.floor(parsedAge) === targetNum) return true;
      return (
        text.includes(`${targetNum} yaş`) ||
        text.includes(`${targetNum} yas`) ||
        text.includes(`${targetNum}ya`)
      );
    }

    return text.includes(norm);
  });
}

export function matchHorseColor(
  card: { title?: string; brand?: string | null },
  selectedColors?: string[] | null
): boolean {
  if (!selectedColors || selectedColors.length === 0) return true;
  const text = `${card.title ?? ''} ${card.brand ?? ''}`.toLocaleLowerCase('tr');

  return selectedColors.some((c) => {
    const norm = c.trim().toLocaleLowerCase('tr');
    if (norm === 'al') {
      return (
        /\bal\b/i.test(text) ||
        text.includes('al don') ||
        text.includes('al kısrak') ||
        text.includes('al aygır') ||
        text.includes('al tay')
      );
    }
    if (norm === 'kır' || norm === 'kir') {
      return text.includes('kır') || text.includes('kir') || text.includes('kır don');
    }
    if (norm === 'doru') {
      return text.includes('doru');
    }
    if (norm === 'yağız' || norm === 'yagiz') {
      return text.includes('yağız') || text.includes('yagiz');
    }
    if (norm === 'kula') {
      return text.includes('kula');
    }
    if (norm === 'boz') {
      return text.includes('boz');
    }
    if (norm === 'beyaz') {
      return text.includes('beyaz') || text.includes('white');
    }
    return text.includes(norm);
  });
}

