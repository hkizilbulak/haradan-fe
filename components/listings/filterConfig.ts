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
  '0',
  '1',
  '1.5',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10-15 arası',
  '15 üzeri',
];

export const STUD_AGE_OPTIONS = [...HORSE_AGE_OPTIONS];

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

import type { CategoryTreeNode } from '@/types';

function hasAncestorSlug(
  tree: CategoryTreeNode[] | undefined,
  targetSlug: string | null | undefined,
  ancestorSlugs: string[]
): boolean {
  if (!tree || tree.length === 0 || !targetSlug) return false;
  const cleanTarget = targetSlug.toLowerCase().replace(/^cat-/, '');

  const checkNode = (node: CategoryTreeNode, isUnderAncestor: boolean): boolean => {
    const nodeSlugClean = node.slug.toLowerCase().replace(/^cat-/, '');
    const isAncestor = ancestorSlugs.some(
      (a) => a.toLowerCase().replace(/^cat-/, '') === nodeSlugClean
    );
    const under = isUnderAncestor || isAncestor;
    if (
      node.slug.toLowerCase() === targetSlug.toLowerCase() ||
      node.id.toLowerCase() === targetSlug.toLowerCase() ||
      nodeSlugClean === cleanTarget
    ) {
      return under;
    }
    for (const child of node.children || []) {
      if (checkNode(child, under)) return true;
    }
    return false;
  };

  for (const root of tree) {
    if (checkNode(root, false)) return true;
  }
  return false;
}

export function isHorseCategory(slug: string | null, categoryTree?: CategoryTreeNode[]): boolean {
  if (!slug) return false;
  if (categoryTree && categoryTree.length > 0) {
    if (hasAncestorSlug(categoryTree, slug, ['satilik-atlar', 'cat-satilik-atlar'])) {
      return true;
    }
  }
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

export function isPansiyonCategory(slug: string | null, categoryTree?: CategoryTreeNode[]): boolean {
  if (!slug) return false;
  if (categoryTree && categoryTree.length > 0) {
    if (hasAncestorSlug(categoryTree, slug, ['pansiyon-haralar', 'cat-pansiyon', 'ahir-tesisler'])) {
      return true;
    }
  }
  const s = slug.toLowerCase();
  return (
    s === 'pansiyon-haralar' ||
    s === 'cat-pansiyon' ||
    s.includes('pansiyon') ||
    s.includes('hara')
  );
}

export function isTransportCategory(slug: string | null, categoryTree?: CategoryTreeNode[]): boolean {
  if (!slug) return false;
  if (categoryTree && categoryTree.length > 0) {
    if (hasAncestorSlug(categoryTree, slug, ['at-nakliyesi', 'cat-nakliye'])) {
      return true;
    }
  }
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

export function isFarrierCategory(slug: string | null, categoryTree?: CategoryTreeNode[]): boolean {
  if (!slug) return false;
  if (categoryTree && categoryTree.length > 0) {
    if (hasAncestorSlug(categoryTree, slug, ['nalbantlar', 'cat-nalbant'])) {
      return true;
    }
  }
  const s = slug.toLowerCase();
  return (
    s === 'nalbantlar' ||
    s === 'cat-nalbant' ||
    s.includes('nalbant') ||
    s.includes('farrier')
  );
}

export function isStudCategory(slug: string | null, categoryTree?: CategoryTreeNode[]): boolean {
  if (!slug) return false;
  if (categoryTree && categoryTree.length > 0) {
    if (hasAncestorSlug(categoryTree, slug, ['asim-hizmetleri', 'cat-asim'])) {
      return true;
    }
  }
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
  card: { title?: string; brand?: string | null; categoryId?: string; properties?: Record<string, unknown> | null },
  selectedGenders?: string[] | null
): boolean {
  if (!selectedGenders || selectedGenders.length === 0) return true;
  const props = card.properties || {};
  const rawPropGender = String(
    props.HORSE_GENDER ??
      props['Cinsiyet'] ??
      props.gender ??
      props['cinsiyet'] ??
      props.cinsiyeti ??
      props.sex ??
      (card as any).gender ??
      ''
  ).trim().toLocaleLowerCase('tr');

  const rawTitle = (card.title ?? '').toLocaleLowerCase('tr');
  const rawBrand = (card.brand ?? '').toLocaleLowerCase('tr');
  const catId = (card.categoryId ?? '').toLocaleLowerCase('tr');
  const text = `${rawTitle} ${rawBrand} ${catId} ${rawPropGender}`;

  const isFemale =
    rawPropGender === 'dişi' ||
    rawPropGender === 'disi' ||
    rawPropGender === 'k' ||
    rawPropGender === 'f' ||
    rawPropGender === 'female' ||
    rawPropGender === 'kısrak' ||
    rawPropGender === 'kisrak' ||
    rawPropGender === 'mare' ||
    rawPropGender === 'filly' ||
    catId === 'cat-kisrak' ||
    text.includes('kısrak') ||
    text.includes('kisrak') ||
    text.includes('dişi') ||
    text.includes('disi') ||
    text.includes('mare') ||
    text.includes('filly') ||
    text.includes('dişi tay');

  const isGelding =
    rawPropGender === 'iğdiş' ||
    rawPropGender === 'igdis' ||
    rawPropGender === 'i' ||
    rawPropGender === 'gelding' ||
    catId === 'cat-pony' ||
    text.includes('iğdiş') ||
    text.includes('igdis') ||
    text.includes('gelding') ||
    text.includes('pony') ||
    text.includes('midilli');

  const isMale =
    rawPropGender === 'erkek' ||
    rawPropGender === 'e' ||
    rawPropGender === 'm' ||
    rawPropGender === 'male' ||
    rawPropGender === 'aygır' ||
    rawPropGender === 'aygir' ||
    rawPropGender === 'stallion' ||
    rawPropGender === 'colt' ||
    (!isFemale &&
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
        !isGelding));

  return selectedGenders.some((g) => {
    const norm = g.trim().toLocaleLowerCase('tr');
    if (norm === 'erkek') return isMale;
    if (norm === 'dişi' || norm === 'disi') return isFemale;
    if (norm === 'iğdiş' || norm === 'igdis') return isGelding;
    return text.includes(norm);
  });
}

export function matchHorseBreed(
  card: { title?: string; brand?: string | null; categoryId?: string; properties?: Record<string, unknown> | null },
  selectedBreeds?: string[] | null
): boolean {
  if (!selectedBreeds || selectedBreeds.length === 0) return true;
  const props = card.properties || {};
  const rawPropBreed = String(
    props.HORSE_BREED ??
      props.STALLION_BREED ??
      props['At Irkı'] ??
      props['Aygır Irkı'] ??
      props.studBreed ??
      props.breed ??
      props.horseBreed ??
      props['Irk'] ??
      props['ırk'] ??
      (card as any).breed ??
      ''
  ).trim().toLocaleLowerCase('tr');

  const rawTitle = (card.title ?? '').toLocaleLowerCase('tr');
  const rawBrand = (card.brand ?? '').toLocaleLowerCase('tr');
  const catId = (card.categoryId ?? '').toLocaleLowerCase('tr');
  const text = `${rawTitle} ${rawBrand} ${catId} ${rawPropBreed}`;

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
  card: { title?: string; brand?: string | null; properties?: Record<string, unknown> | null },
  selectedAges?: string[] | null
): boolean {
  if (!selectedAges || selectedAges.length === 0) return true;
  const props = card.properties || {};
  const rawPropAge =
    props.HORSE_AGE ??
    props.STALLION_AGE ??
    props['Yaş'] ??
    props['Aşım Yaşı'] ??
    props.studAge ??
    props.age ??
    (props.birthYear && Number(props.birthYear) > 1900
      ? new Date().getFullYear() - Number(props.birthYear)
      : null);

  const propAgeNum =
    rawPropAge != null && !isNaN(Number(String(rawPropAge).replace(',', '.')))
      ? parseFloat(String(rawPropAge).replace(',', '.'))
      : null;

  const text = (card.title ?? '').toLocaleLowerCase('tr');

  // Extract age number from title if exists: e.g. "3 yaş", "5 yaş", "7 yaşlı", "1.5 yaş"
  const ageMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:yaş|yas|ya)/);
  const parsedAge = propAgeNum != null ? propAgeNum : (ageMatch ? parseFloat(ageMatch[1].replace(',', '.')) : null);

  return selectedAges.some((ageOption) => {
    const norm = ageOption.trim().toLocaleLowerCase('tr');

    // 10-15 arası
    if (norm.includes('10-15')) {
      if (parsedAge != null && parsedAge >= 10 && parsedAge <= 15) return true;
      return (
        text.includes('10-15') ||
        /\b(?:10|11|12|13|14|15)\s*(?:yaş|yas|ya)\b/i.test(text)
      );
    }

    // 15 üzeri
    if (norm.includes('15') && (norm.includes('üzeri') || norm.includes('uzeri'))) {
      if (parsedAge != null && parsedAge >= 15) return true;
      return (
        text.includes('15 üzeri') ||
        /\b(?:15|16|17|18|19|20|21|22|23|24|25)\s*(?:yaş|yas|ya)\b/i.test(text)
      );
    }

    // 5+ Yaş legacy
    if (norm.includes('5+') || norm === '5+') {
      if (parsedAge != null && parsedAge >= 5) return true;
      return (
        text.includes('5+') ||
        /\b(?:5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)\s*(?:yaş|yas|ya)\b/i.test(text)
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
        /\b[01]\s*(?:yaş|yas|ya)\b/i.test(text) ||
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

    // Specific number: e.g. "2", "3", "4", "5", etc.
    const targetNumMatch = norm.match(/(\d+)/);
    if (targetNumMatch) {
      const targetNum = parseInt(targetNumMatch[1], 10);
      if (parsedAge != null && Math.floor(parsedAge) === targetNum) return true;
      const regex = new RegExp(`\\b${targetNum}\\s*(?:yaş|yas|ya)\\b`, 'i');
      return regex.test(text);
    }

    return text.includes(norm);
  });
}

export function normalizeCoat(raw: string | null | undefined): string {
  if (!raw) return '';
  const value = raw.trim().toLocaleLowerCase('tr');
  if (!value) return '';
  if (
    value === 'k' ||
    value === 'kır' ||
    value === 'kir' ||
    value === 'kr' ||
    value === 'grey' ||
    value === 'gray' ||
    value === 'gr' ||
    value.startsWith('kır ') ||
    value.startsWith('kir ') ||
    value.includes('kır don') ||
    value.includes('kir don')
  ) {
    return 'Kır';
  }
  if (
    value === 'd' ||
    value === 'doru' ||
    value === 'bay' ||
    value === 'da' ||
    value === 'doru al' ||
    value.startsWith('doru ') ||
    value.includes('doru don')
  ) {
    return 'Doru';
  }
  if (
    value === 'a' ||
    value === 'al' ||
    value === 'chestnut' ||
    value === 'sorrel' ||
    value === 'ch' ||
    value.startsWith('al ') ||
    value.includes('al don')
  ) {
    return 'Al';
  }
  if (
    value === 'y' ||
    value === 'ya' ||
    value === 'yağız' ||
    value === 'yagiz' ||
    value === 'black' ||
    value === 'bl' ||
    value.startsWith('yağız ') ||
    value.startsWith('yagiz ')
  ) {
    return 'Yağız';
  }
  if (
    value === 'b' ||
    value === 'beyaz' ||
    value === 'white' ||
    value === 'wh' ||
    value === 'ak'
  ) {
    return 'Beyaz';
  }
  if (
    value === 'ku' ||
    value === 'kula' ||
    value === 'dun' ||
    value === 'buckskin'
  ) {
    return 'Kula';
  }
  if (
    value === 'boz' ||
    value === 'roan' ||
    value === 'grullo'
  ) {
    return 'Boz';
  }
  if (value === 'ka' || value === 'kestane') {
    return 'Kestane';
  }
  return raw.trim();
}

export function matchHorseColor(
  card: { title?: string; brand?: string | null; properties?: Record<string, unknown> | null },
  selectedColors?: string[] | null
): boolean {
  if (!selectedColors || selectedColors.length === 0) return true;
  const props = card.properties || {};
  const rawPropColor = String(
    props.COAT_COLOR ??
      props['Donu (Renk)'] ??
      props['Donu'] ??
      props['Don'] ??
      props['Renk'] ??
      props.studCoatColor ??
      props.coatColor ??
      props.coat ??
      props.horseCoat ??
      props.don ??
      props.color ??
      (card as any).coatColor ??
      (card as any).coat ??
      ''
  ).trim();

  const normPropCoat = normalizeCoat(rawPropColor);
  const rawLower = rawPropColor.toLocaleLowerCase('tr');
  const text = `${card.title ?? ''} ${card.brand ?? ''} ${rawPropColor}`.toLocaleLowerCase('tr');

  return selectedColors.some((c) => {
    const targetNorm = normalizeCoat(c);
    const norm = c.trim().toLocaleLowerCase('tr');

    // 1. Direct match on normalized coat
    if (targetNorm && normPropCoat && targetNorm === normPropCoat) {
      return true;
    }

    // 2. Target is Kır
    if (norm === 'kır' || norm === 'kir' || targetNorm === 'Kır') {
      return (
        normPropCoat === 'Kır' ||
        rawLower === 'k' ||
        rawLower === 'kır' ||
        rawLower === 'kir' ||
        rawLower === 'grey' ||
        rawLower === 'gray' ||
        rawLower === 'gr' ||
        rawLower === 'kr' ||
        text.includes('kır') ||
        text.includes('kir') ||
        text.includes('kır don') ||
        text.includes('grey') ||
        text.includes('gray')
      );
    }

    // 3. Target is Doru
    if (norm === 'doru' || targetNorm === 'Doru') {
      return (
        normPropCoat === 'Doru' ||
        rawLower === 'd' ||
        rawLower === 'doru' ||
        rawLower === 'bay' ||
        rawLower === 'da' ||
        rawLower === 'doru al' ||
        text.includes('doru') ||
        text.includes('bay')
      );
    }

    // 4. Target is Al
    if (norm === 'al' || targetNorm === 'Al') {
      return (
        normPropCoat === 'Al' ||
        rawLower === 'a' ||
        rawLower === 'al' ||
        rawLower === 'chestnut' ||
        rawLower === 'sorrel' ||
        rawLower === 'ch' ||
        /\bal\b/i.test(text) ||
        text.includes('al don') ||
        text.includes('al kısrak') ||
        text.includes('al aygır') ||
        text.includes('al tay') ||
        text.includes('chestnut')
      );
    }

    // 5. Target is Yağız
    if (norm === 'yağız' || norm === 'yagiz' || targetNorm === 'Yağız') {
      return (
        normPropCoat === 'Yağız' ||
        rawLower === 'y' ||
        rawLower === 'ya' ||
        rawLower === 'yağız' ||
        rawLower === 'yagiz' ||
        rawLower === 'black' ||
        rawLower === 'bl' ||
        text.includes('yağız') ||
        text.includes('yagiz') ||
        text.includes('black')
      );
    }

    // 6. Target is Beyaz
    if (norm === 'beyaz' || targetNorm === 'Beyaz') {
      return (
        normPropCoat === 'Beyaz' ||
        rawLower === 'b' ||
        rawLower === 'beyaz' ||
        rawLower === 'white' ||
        rawLower === 'wh' ||
        rawLower === 'ak' ||
        text.includes('beyaz') ||
        text.includes('white')
      );
    }

    // 7. Target is Kula
    if (norm === 'kula' || targetNorm === 'Kula') {
      return (
        normPropCoat === 'Kula' ||
        rawLower === 'ku' ||
        rawLower === 'kula' ||
        rawLower === 'dun' ||
        rawLower === 'buckskin' ||
        text.includes('kula') ||
        text.includes('dun') ||
        text.includes('buckskin')
      );
    }

    // 8. Target is Boz
    if (norm === 'boz' || targetNorm === 'Boz') {
      return (
        normPropCoat === 'Boz' ||
        rawLower === 'boz' ||
        rawLower === 'roan' ||
        rawLower === 'grullo' ||
        text.includes('boz') ||
        text.includes('roan')
      );
    }

    return (
      rawLower === norm ||
      (normPropCoat ? normPropCoat.toLocaleLowerCase('tr') === norm : false) ||
      text.includes(norm)
    );
  });
}

