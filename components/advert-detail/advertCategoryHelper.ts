import type { AdvertDetail } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { openTjkHorseSearch } from '@/utils/tjkLinks';

export type AdvertCategoryKind = 'pansiyon' | 'transport' | 'farrier' | 'stud' | 'horse';

export function getAdvertCategoryKind(detail: AdvertDetail): AdvertCategoryKind {
  const catId = (detail.categoryId ?? '').toLowerCase();
  const categoryCrumbs = (detail.breadcrumbs ?? [])
    .filter((b) => b.href !== '/' && b.href !== '/my-listings' && b.label !== detail.title)
    .map((b) => b.label.toLowerCase())
    .join(' ');
  const catName = (
    (detail as any).category?.name ||
    (detail as any).category?.slug ||
    ''
  ).toLowerCase();

  const text = `${catId} ${catName} ${categoryCrumbs}`.trim();

  if (text.includes('pansiyon') || text.includes('haralar') || text.includes('cat-pansiyon')) {
    return 'pansiyon';
  }
  if (
    text.includes('nakliye') ||
    text.includes('tasima') ||
    text.includes('taşıma') ||
    text.includes('transport') ||
    text.includes('cat-nakliye')
  ) {
    return 'transport';
  }
  if (text.includes('nalbant') || text.includes('farrier') || text.includes('cat-nalbant')) {
    return 'farrier';
  }
  if (
    text.includes('asim') ||
    text.includes('aşım') ||
    text.includes('aygir') ||
    text.includes('aygır') ||
    text.includes('cat-asim') ||
    text.includes('cat-arap-aygir') ||
    text.includes('cat-ingiliz-aygir') ||
    text.includes('arap-aygir') ||
    text.includes('ingiliz-aygir') ||
    text.includes('stallion') ||
    text.includes('stud')
  ) {
    return 'stud';
  }
  return 'horse';
}

export const CATEGORY_NAMES_BY_ID_OR_SLUG: Record<string, string> = {
  'c1000000-0000-4000-8000-000000000011': 'Satılık Yarış Atı',
  'satilik-yaris-ati': 'Satılık Yarış Atı',
  'cat-satilik-yaris-ati': 'Satılık Yarış Atı',
  'c-satilik-yaris': 'Satılık Yarış Atı',
  'c1000000-0000-4000-8000-000000000012': 'Satılık Kısrak',
  'satilik-kisrak': 'Satılık Kısrak',
  'c-satilik-kisrak': 'Satılık Kısrak',
  'c1000000-0000-4000-8000-000000000013': 'Satılık Aygır',
  'satilik-aygir': 'Satılık Aygır',
  'c-satilik-aygir': 'Satılık Aygır',
  'c1000000-0000-4000-8000-000000000014': 'Satılık Binek Atı',
  'satilik-binek-ati': 'Satılık Binek Atı',
  'c-satilik-binek': 'Satılık Binek Atı',
  'c1000000-0000-4000-8000-000000000015': 'Satılık Pony',
  'satilik-pony': 'Satılık Pony',
  'c-satilik-pony': 'Satılık Pony',
  'c1000000-0000-4000-8000-000000000021': 'Pansiyon Haralar',
  'pansiyon-haralar': 'Pansiyon Haralar',
  'c1000000-0000-4000-8000-000000000022': 'At Nakliyesi',
  'at-nakliyesi': 'At Nakliyesi',
  'c1000000-0000-4000-8000-000000000023': 'Nalbantlar',
  'nalbantlar': 'Nalbantlar',
};

export function getAdvertCategoryName(detail?: AdvertDetail | null): string {
  if (!detail) return '';
  const rawCatId = (detail.categoryId ?? '').trim();
  const knownName =
    CATEGORY_NAMES_BY_ID_OR_SLUG[rawCatId] ||
    CATEGORY_NAMES_BY_ID_OR_SLUG[rawCatId.toLowerCase()];

  return (
    (detail.breadcrumbs && detail.breadcrumbs.length > 1
      ? detail.breadcrumbs[detail.breadcrumbs.length - 2]?.label
      : '') ||
    (detail as any)?.category?.name ||
    knownName ||
    detail.horse?.breed ||
    (getAdvertCategoryKind(detail) === 'farrier' ? 'Nalbantlar' : 'Satılık Yarış Atı')
  );
}

export function isRaceHorseAdvert(
  detail?: AdvertDetail | null,
  resolvedCategoryName?: string
): boolean {
  if (!detail) return false;
  if (getAdvertCategoryKind(detail) !== 'horse') return false;

  const catId = (detail.categoryId ?? '').toLowerCase().trim();
  const catObj = (detail as any).category;
  const catSlug = (catObj?.slug || (detail as any).categorySlug || '').toLowerCase();
  const catName = (catObj?.name || '').toLowerCase();
  const resolved = (resolvedCategoryName || '').toLowerCase();

  // If explicitly a non-race category (kısrak, binek, pony, aygır), return false
  const nonRaceTerms = ['kisrak', 'kısrak', 'binek', 'pony', 'aygir', 'aygır'];
  const isNonRace = nonRaceTerms.some(
    (t) =>
      catId.includes(t) ||
      catSlug.includes(t) ||
      catName.includes(t) ||
      resolved.includes(t)
  );
  if (isNonRace) return false;

  // Check breadcrumbs for non-race category
  const crumbs = (detail.breadcrumbs ?? [])
    .filter((b) => b.href !== '/' && b.href !== '/my-listings' && b.label !== detail.title);
  for (const b of crumbs) {
    const l = b.label.toLowerCase();
    if (nonRaceTerms.some((t) => l.includes(t))) {
      return false;
    }
  }

  // Check if explicitly race horse
  const isExplicitRace =
    catId === 'c1000000-0000-4000-8000-000000000011' ||
    catId === 'satilik-yaris-ati' ||
    catId === 'cat-satilik-yaris-ati' ||
    catId === 'c-satilik-yaris' ||
    catId.includes('yaris') ||
    catId.includes('yarış') ||
    catSlug.includes('yaris') ||
    catSlug.includes('yarış') ||
    catName.includes('yaris') ||
    catName.includes('yarış') ||
    resolved.includes('yaris') ||
    resolved.includes('yarış');

  if (isExplicitRace) return true;

  for (const b of crumbs) {
    const l = b.label.toLowerCase();
    if (l.includes('yaris') || l.includes('yarış')) {
      return true;
    }
  }

  return false;
}

export type ParsedHorseInfo = {
  name: string;
  breed: string;
  age: string;
  coatColor: string;
  gender: string;
  sire: string;
  dam: string;
  damsire: string;
};

export function formatHorseAge(rawAge: unknown): string {
  if (rawAge == null || rawAge === '') return '';
  const str = String(rawAge).trim();
  if (!str) return '';

  const lower = str.toLowerCase();

  // Guard against legacy corrupted "1015" from parseInt(replace(/\D/g, ''))
  if (lower === '1015' || lower === '1015 yaş' || lower === '1015 yas') {
    return '10-15 Yaş arası';
  }

  // Range: 10-15 or 10-15 arası
  if (lower.includes('10-15') || lower.includes('10 - 15')) {
    return '10-15 Yaş arası';
  }

  // 15 üzeri
  if (lower.includes('15') && (lower.includes('üzeri') || lower.includes('uzeri') || lower.includes('+'))) {
    return '15 Yaş üzeri';
  }

  // If already contains 'yaş' or 'yas'
  if (lower.includes('yaş') || lower.includes('yas')) {
    return str;
  }

  // Other "arası" or "üzeri"
  if (lower.includes('arası') || lower.includes('üzeri')) {
    return str;
  }

  return `${str} Yaş`;
}

export function parseHorseInfo(detail: AdvertDetail): ParsedHorseInfo {
  const horse = detail.horse;
  const title = detail.title;

  const specMap: Record<string, string> = {};
  (detail.specs ?? []).forEach((g) => {
    g.rows.forEach((r) => {
      const key = (r.label || '').toLowerCase().replace(/[-_\s\(\)]/g, '');
      specMap[key] = String(r.value || '');
    });
  });

  const rawProps = (detail as any).properties || (detail as any).rawProperties || {};
  const getProp = (keys: string[]): string => {
    for (const k of keys) {
      const normK = k.toLowerCase().replace(/[-_\s\(\)]/g, '');
      if (specMap[normK]) return specMap[normK];
      for (const [pk, pv] of Object.entries(rawProps)) {
        if (pk.toLowerCase().replace(/[-_\s\(\)]/g, '') === normK && pv != null && pv !== '') {
          return String(pv);
        }
      }
    }
    return '';
  };

  const name =
    (horse?.registeredName && horse.registeredName !== 'Başlıksız ilan' && horse.registeredName !== '-'
      ? horse.registeredName
      : '') ||
    getProp(['atadi', 'aygiradi', 'isim', 'registeredname', 'horsename', 'studhorsename', 'studhorse']) ||
    title ||
    '-';

  const sire =
    (horse?.sire && horse.sire !== '-' ? horse.sire : '') ||
    getProp(['baba', 'sire', 'babaadi', 'babasire', 'studsire']) ||
    '-';

  const dam =
    (horse?.dam && horse.dam !== '-' ? horse.dam : '') ||
    getProp(['anne', 'dam', 'anneadi', 'annedam', 'studdam']) ||
    '-';

  const damsire =
    (horse?.damsire && horse.damsire !== '-' ? horse.damsire : '') ||
    getProp([
      'annesininbabasi',
      'kisrakbabasi',
      'damsire',
      'studdamsire',
      'studdamsire',
      'anneninbabasidamsire',
      'anneninbabasi',
    ]) ||
    '-';

  const breed =
    (horse?.breed && horse.breed !== 'Bilinmiyor' && horse.breed !== '-' ? horse.breed : '') ||
    getProp(['atirki', 'irk', 'ırk', 'safkan', 'breed', 'horsebreed', 'studbreed', 'stallionbreed']) ||
    'İngiliz';

  const categoryKind = getAdvertCategoryKind(detail);
  const isStud =
    categoryKind === 'stud' ||
    Boolean(getProp(['studbreed', 'stallionbreed', 'studhorse', 'studhorsename', 'studsire', 'studdam', 'studage', 'studcoatcolor']));

  const gender =
    (horse?.gender && (horse.gender as string) !== '-' ? horse.gender : '') ||
    getProp(['cinsiyet', 'gender', 'horsegender']) ||
    (isStud ? 'Erkek' : '-');

  const coatColor =
    (horse?.coatColor && horse.coatColor !== 'Bilinmiyor' && horse.coatColor !== '-' ? horse.coatColor : '') ||
    getProp(['donu', 'don', 'donurenk', 'coatcolor', 'studcoatcolor']) ||
    '-';

  const rawPropAge = getProp(['yas', 'yaş', 'age', 'horseage', 'studage', 'stallionage']);
  const rawAge =
    (rawPropAge && rawPropAge !== '1015' && rawPropAge !== '1015 Yaş' ? rawPropAge : '') ||
    (horse?.age != null && horse.age !== 0 && horse.age !== '' ? String(horse.age) : '') ||
    rawPropAge;
  const age = formatHorseAge(rawAge);

  return { name, breed, age, coatColor, gender, sire, dam, damsire };
}

export type ParsedStudInfo = {
  name: string;
  breed: string;
  age: string;
  gender: string;
  coatColor: string;
  sire: string;
  dam: string;
  damsire: string;
};

export function parseStudInfo(detail: AdvertDetail): ParsedStudInfo {
  const horse = detail.horse;
  const title = detail.title;

  const specMap: Record<string, string> = {};
  (detail.specs ?? []).forEach((g) => {
    g.rows.forEach((r) => {
      specMap[r.label.toLowerCase()] = r.value;
    });
  });

  const name =
    specMap['at / aygır adı'] ||
    specMap['aygır adı'] ||
    specMap['at adı'] ||
    specMap['studhorsename'] ||
    (horse.registeredName && horse.registeredName !== 'Başlıksız ilan'
      ? horse.registeredName
      : '') ||
    (title.includes('—') ? title.split('—')[0].trim() : title);

  const breed =
    specMap['at ırkı'] ||
    specMap['ırk'] ||
    specMap['studbreed'] ||
    (horse.breed && horse.breed !== 'Bilinmiyor' ? horse.breed : '') ||
    (title.toLowerCase().includes('arap')
      ? 'Arap'
      : title.toLowerCase().includes('ingiliz')
      ? 'İngiliz'
      : '');

  const rawStudAge =
    specMap['yaş'] ||
    specMap['studage'] ||
    specMap['stallionage'] ||
    (horse?.age != null && horse.age !== 0 && horse.age !== '' ? String(horse.age) : '');

  const age = formatHorseAge(rawStudAge);

  const coatColor =
    specMap['donu (renk)'] ||
    specMap['donu'] ||
    specMap['don'] ||
    specMap['studcoatcolor'] ||
    (horse.coatColor && horse.coatColor !== 'Bilinmiyor'
      ? horse.coatColor
      : '');

  const sire =
    specMap['baba'] ||
    specMap['baba (sire)'] ||
    specMap['studsire'] ||
    (horse.sire && horse.sire !== 'Bilinmiyor' ? horse.sire : '');

  const dam =
    specMap['anne'] ||
    specMap['anne (dam)'] ||
    specMap['studdam'] ||
    (horse.dam && horse.dam !== 'Bilinmiyor' ? horse.dam : '');

  const damsire =
    specMap['annesinin babası'] ||
    specMap['kısrak babası'] ||
    specMap['studdamsire'] ||
    (horse.damsire && horse.damsire !== 'Bilinmiyor' ? horse.damsire : '');

  return { name, breed, age, gender: 'Erkek', coatColor, sire, dam, damsire };
}

export type ParsedPansiyonInfo = {
  hasGrassPaddock: boolean;
  hasSandPaddock: boolean;
  hasStallionPaddock: boolean;
  hasVeterinarian: boolean;
  hasFarrier: boolean;
  hasFoalingBarn: boolean;
  hasTrainingTrack: boolean;
  trainingTrack: string;
};

export function parsePansiyonInfo(detail: AdvertDetail): ParsedPansiyonInfo {
  const specMap: Record<string, string> = {};
  (detail.specs ?? []).forEach((g) => {
    g.rows.forEach((r) => {
      specMap[r.label.toLowerCase()] = r.value;
    });
  });

  const text = `${detail.title} ${detail.description} ${JSON.stringify(
    detail.specs ?? []
  )}`.toLowerCase();

  const isSpecTrue = (key: string) => {
    const val = specMap[key]?.toLowerCase();
    return val === 'true' || val === 'evet' || val === 'var' || val === 'mevcut';
  };

  return {
    hasGrassPaddock:
      isSpecTrue('çim padok') ||
      isSpecTrue('grasspaddock') ||
      isSpecTrue('facilitygrasspaddock') ||
      text.includes('çim padok') ||
      text.includes('cim padok') ||
      text.includes('çim'),
    hasSandPaddock:
      isSpecTrue('kum padok') ||
      isSpecTrue('sandpaddock') ||
      isSpecTrue('facilitysandpaddock') ||
      text.includes('kum padok') ||
      text.includes('kum'),
    hasStallionPaddock:
      isSpecTrue('aygır padoğu') ||
      isSpecTrue('stallionpaddock') ||
      isSpecTrue('facilitystallionpaddock') ||
      text.includes('aygır padoğu') ||
      text.includes('aygir padogu'),
    hasVeterinarian:
      isSpecTrue('veteriner') ||
      isSpecTrue('vet') ||
      isSpecTrue('facilityveterinarian') ||
      text.includes('veteriner') ||
      text.includes('hekim'),
    hasFarrier:
      isSpecTrue('nalbant') ||
      isSpecTrue('farrier') ||
      isSpecTrue('facilityfarrier') ||
      text.includes('nalbant') ||
      text.includes('nal'),
    hasFoalingBarn:
      isSpecTrue('doğumhane') ||
      isSpecTrue('foalingbarn') ||
      isSpecTrue('facilityfoalingbarn') ||
      text.includes('doğumhane') ||
      text.includes('dogumhane') ||
      text.includes('doğum'),
    hasTrainingTrack:
      isSpecTrue('idman pisti') ||
      isSpecTrue('idmanpisti') ||
      isSpecTrue('trainingtrack') ||
      isSpecTrue('facilitytrainingtrack') ||
      Boolean(specMap['idman pisti'] || specMap['trainingtrack'] || specMap['facilitytrainingtrack']) ||
      text.includes('idman pisti') ||
      text.includes('kum pist'),
    trainingTrack:
      specMap['idman pisti'] ||
      specMap['trainingtrack'] ||
      specMap['facilitytrainingtrack'] ||
      '',
  };
}

export type ParsedTransportInfo = {
  companyName: string;
  websiteUrl: string;
};

export function parseTransportInfo(detail: AdvertDetail): ParsedTransportInfo {
  const specMap: Record<string, string> = {};
  (detail.specs ?? []).forEach((g) => {
    g.rows.forEach((r) => {
      specMap[r.label.toLowerCase()] = r.value;
    });
  });

  return {
    companyName:
      specMap['firma adı'] ||
      specMap['companyname'] ||
      (detail.title.includes('—')
        ? detail.title.split('—')[0].trim()
        : detail.brand || detail.title),
    websiteUrl:
      specMap['web sitesi'] ||
      specMap['websiteurl'] ||
      specMap['website'] ||
      '',
  };
}

export type AdvertInfoRow = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  isBoolean?: boolean;
  hint?: string;
  badge?: string;
  badgeTone?: 'primary' | 'muted' | 'success';
};

export function normalizeLabel(raw: string): string {
  const norm = (raw || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (norm.startsWith('cinsiyet')) return 'Cinsiyet';
  if (norm.startsWith('cins')) return 'At Irkı';
  if (norm.startsWith('irk') || norm.startsWith('ırk')) return 'At Irkı';
  if (norm.startsWith('yas') || norm.startsWith('yaş')) return 'Yaş';
  if (norm.startsWith('don') || norm.startsWith('donu')) return 'Donu';
  if (norm.startsWith('baba adi') || norm.startsWith('baba adı') || norm === 'baba') return 'Baba Adı';
  if (norm.startsWith('anne adi') || norm.startsWith('anne adı') || norm === 'anne') return 'Anne Adı';
  if (norm.includes('annesinin baba') || norm.includes('anne baba')) return 'Annesinin Baba Adı';
  if (norm.startsWith('at adi') || norm.startsWith('at adı') || norm.startsWith('isim')) return 'At Adı';
  return raw;
}

export function getRowIcon(label: string): keyof typeof Ionicons.glyphMap {
  const l = label.toLowerCase();
  if (l.includes('ilan no')) return 'pricetag-outline';
  if (l.includes('tarih')) return 'calendar-outline';
  if (l.includes('fiyat')) return 'cash-outline';
  if (l.includes('konum')) return 'location-outline';
  if (l.includes('kategori')) return 'grid-outline';
  if (l.includes('at adı') || l.includes('isim')) return 'ribbon-outline';
  if (l.includes('baba')) return 'git-branch-outline';
  if (l.includes('anne')) return 'heart-outline';
  if (l.includes('ırk') || l.includes('cins')) return 'color-palette-outline';
  if (l.includes('yaş') || l.includes('dogum') || l.includes('doğum')) return 'hourglass-outline';
  if (l.includes('cinsiyet')) return 'male-female-outline';
  if (l.includes('don')) return 'brush-outline';
  if (l.includes('idman')) return 'fitness-outline';
  if (l.includes('kiralık') || l.includes('kiralik')) return 'key-outline';
  if (l.includes('koşar') || l.includes('kosar')) return 'flash-outline';
  if (l.includes('padok')) return 'leaf-outline';
  if (l.includes('doğumhane') || l.includes('pansiyon')) return 'home-outline';
  if (l.includes('nalbant')) return 'hammer-outline';
  if (l.includes('veteriner')) return 'medkit-outline';
  if (l.includes('aşım') || l.includes('aygır')) return 'trophy-outline';
  if (l.includes('kapasite') || l.includes('araç')) return 'car-outline';
  return 'ellipse-outline';
}

export function buildAdvertInfoRows(detail: AdvertDetail): AdvertInfoRow[] {
  const list: AdvertInfoRow[] = [];

  // 1. İlan No
  list.push({
    label: 'İlan No',
    value: detail.id ? String(detail.id) : '-',
    icon: 'pricetag-outline',
  });

  // 2. İlan Tarihi
  const formatPublishDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };
  list.push({
    label: 'İlan Tarihi',
    value: formatPublishDate(detail.publishedAt),
    icon: 'calendar-outline',
  });

  // 3. Kategori
  const categoryName = getAdvertCategoryName(detail);
  list.push({
    label: 'Kategori',
    value: categoryName,
    icon: 'grid-outline',
  });

  const categoryKind = getAdvertCategoryKind(detail);

  if (categoryKind === 'pansiyon') {
    const pansiyonInfo = parsePansiyonInfo(detail);
    list.push({ label: 'Çim Padok', value: pansiyonInfo.hasGrassPaddock ? 'Evet' : 'Hayır', icon: 'leaf-outline', isBoolean: true });
    list.push({ label: 'Kum Padok', value: pansiyonInfo.hasSandPaddock ? 'Evet' : 'Hayır', icon: 'leaf-outline', isBoolean: true });
    list.push({ label: 'Aygır Padoğu', value: pansiyonInfo.hasStallionPaddock ? 'Evet' : 'Hayır', icon: 'leaf-outline', isBoolean: true });
    list.push({ label: 'Doğumhane', value: pansiyonInfo.hasFoalingBarn ? 'Evet' : 'Hayır', icon: 'home-outline', isBoolean: true });
    list.push({ label: 'Nalbant', value: pansiyonInfo.hasFarrier ? 'Evet' : 'Hayır', icon: 'hammer-outline', isBoolean: true });
    list.push({ label: 'Veteriner Hekim', value: pansiyonInfo.hasVeterinarian ? 'Evet' : 'Hayır', icon: 'medkit-outline', isBoolean: true });
    list.push({ label: 'İdman Pisti', value: (pansiyonInfo.hasTrainingTrack || !!pansiyonInfo.trainingTrack) ? 'Evet' : 'Hayır', icon: 'fitness-outline', isBoolean: true });
  } else if (categoryKind === 'transport') {
    const transportInfo = parseTransportInfo(detail);
    if (transportInfo.companyName) {
      list.push({ label: 'Firma Adı', value: transportInfo.companyName, icon: 'business-outline' });
    }
    if (transportInfo.websiteUrl) {
      list.push({ label: 'Web Sitesi', value: transportInfo.websiteUrl, icon: 'globe-outline' });
    }
    list.push({ label: 'Hizmet', value: 'At Nakliyesi & Taşımacılık', icon: 'car-outline' });
  } else if (categoryKind === 'stud') {
    const studInfo = parseStudInfo(detail);
    if (studInfo.name) list.push({ label: 'Aygır Adı', value: studInfo.name, icon: 'star-outline' });
    if (studInfo.breed) list.push({ label: 'At Irkı', value: studInfo.breed, icon: 'ribbon-outline' });
    if (studInfo.age) list.push({ label: 'Yaş', value: studInfo.age, icon: 'hourglass-outline' });
    list.push({ label: 'Cinsiyet', value: studInfo.gender || 'Erkek', icon: 'male-female-outline' });
    if (studInfo.coatColor) list.push({ label: 'Donu', value: studInfo.coatColor, icon: 'color-palette-outline' });
    if (studInfo.sire) {
      list.push({
        label: 'Baba Adı',
        value: studInfo.sire,
        icon: 'git-branch-outline',
        onPress: studInfo.sire !== '-' ? () => openTjkHorseSearch(studInfo.sire) : undefined,
      });
    }
    if (studInfo.dam) {
      list.push({
        label: 'Anne Adı',
        value: studInfo.dam,
        icon: 'git-branch-outline',
        onPress: studInfo.dam !== '-' ? () => openTjkHorseSearch(studInfo.dam) : undefined,
      });
    }
    if (studInfo.damsire) {
      list.push({
        label: 'Annesinin Baba Adı',
        value: studInfo.damsire,
        icon: 'git-network-outline',
        onPress: studInfo.damsire !== '-' ? () => openTjkHorseSearch(studInfo.damsire) : undefined,
      });
    }
  } else if (categoryKind === 'farrier') {
    const seenLabels = new Set<string>();
    for (const group of detail.specs ?? []) {
      for (const row of group.rows ?? []) {
        const l = row.label.trim();
        const lower = l.toLowerCase();
        if (lower === 'telefon' || lower === 'sellerphone' || lower === 'phone') continue;
        const v = String(row.value).trim();
        const isBool = v.toLowerCase() === 'evet' || v.toLowerCase() === 'hayır' || v.toLowerCase() === 'true' || v.toLowerCase() === 'false';
        const formattedVal = v.toLowerCase() === 'true' ? 'Evet' : v.toLowerCase() === 'false' ? 'Hayır' : v;
        list.push({
          label: l.charAt(0).toLocaleUpperCase('tr-TR') + l.slice(1),
          value: formattedVal,
          icon: getRowIcon(l),
          isBoolean: isBool,
        });
        seenLabels.add(lower);
        seenLabels.add(lower.replace(/[-_\s]/g, ''));
      }
    }
  } else {
    // Horse advert
    const horseInfo = parseHorseInfo(detail);

    // At Adı
    list.push({
      label: 'At Adı',
      value: horseInfo.name,
      icon: 'star-outline',
    });

    // Baba Adı
    const sireName = horseInfo.sire;
    list.push({
      label: 'Baba Adı',
      value: sireName,
      icon: 'git-branch-outline',
      onPress: sireName && sireName !== '-' ? () => openTjkHorseSearch(sireName) : undefined,
    });

    // Anne Adı
    const damName = horseInfo.dam;
    list.push({
      label: 'Anne Adı',
      value: damName,
      icon: 'git-branch-outline',
      onPress: damName && damName !== '-' ? () => openTjkHorseSearch(damName) : undefined,
    });

    // Annesinin Baba Adı
    const damsireName = horseInfo.damsire;
    list.push({
      label: 'Annesinin Baba Adı',
      value: damsireName,
      icon: 'git-network-outline',
      onPress: damsireName && damsireName !== '-' ? () => openTjkHorseSearch(damsireName) : undefined,
    });

    // At Irkı
    list.push({
      label: 'At Irkı',
      value: horseInfo.breed,
      icon: 'leaf-outline',
    });

    // Yaş
    if (horseInfo.age) {
      list.push({
        label: 'Yaş',
        value: horseInfo.age,
        icon: 'hourglass-outline',
      });
    }

    // Cinsiyet
    list.push({
      label: 'Cinsiyet',
      value: horseInfo.gender,
      icon: 'male-female-outline',
    });

    // Donu
    list.push({
      label: 'Donu',
      value: horseInfo.coatColor,
      icon: 'color-palette-outline',
    });

    const normText = (s: string) =>
      (s || '')
        .toLowerCase()
        .replace(/['’`"]/g, '')
        .replace(/[-_\s\(\)]/g, '')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');

    const findProp = (codes: string[], defaultVal: boolean | string | null = null): string | null => {
      const rawProps = (detail as any)?.properties || (detail as any)?.rawProperties || {};
      for (const c of codes) {
        const val =
          rawProps[c] ??
          rawProps[c.toLowerCase()] ??
          rawProps[c.toUpperCase()] ??
          (detail as any)?.[c] ??
          (detail as any)?.[c.toLowerCase()] ??
          (detail as any)?.horse?.[c] ??
          (detail as any)?.horse?.[c.toLowerCase()] ??
          (detail as any)?.details?.[c] ??
          (detail as any)?.details?.[c.toLowerCase()];
        if (val != null && val !== '' && val !== 'null' && val !== 'undefined') {
          if (typeof val === 'boolean') return val ? 'Evet' : 'Hayır';
          if (typeof val === 'string') {
            const lower = val.toLowerCase().trim();
            if (lower === 'true' || lower === 'evet') return 'Evet';
            if (lower === 'false' || lower === 'hayır' || lower === 'hayir') return 'Hayır';
            return val.trim();
          }
          return String(val).trim();
        }
      }
      const normCodes = codes.map(normText);
      for (const [k, val] of Object.entries(rawProps)) {
        if (val != null && val !== '' && val !== 'null' && val !== 'undefined') {
          const kNorm = normText(k);
          if (normCodes.some((c) => kNorm === c || kNorm.includes(c) || c.includes(kNorm))) {
            if (typeof val === 'boolean') return val ? 'Evet' : 'Hayır';
            if (typeof val === 'string') {
              const lower = val.toLowerCase().trim();
              if (lower === 'true' || lower === 'evet') return 'Evet';
              if (lower === 'false' || lower === 'hayır' || lower === 'hayir') return 'Hayır';
              return val.trim();
            }
            return String(val).trim();
          }
        }
      }
      for (const g of detail.specs ?? []) {
        for (const r of g.rows ?? []) {
          if (r.value != null && r.value !== '' && r.value !== 'null' && r.value !== 'undefined') {
            const lNorm = normText(r.label || '');
            if (normCodes.some((c) => lNorm === c || lNorm.includes(c) || c.includes(lNorm))) {
              const v = String(r.value).trim();
              const lower = v.toLowerCase();
              if (lower === 'true' || lower === 'evet') return 'Evet';
              if (lower === 'false' || lower === 'hayır' || lower === 'hayir') return 'Hayır';
              return v;
            }
          }
        }
      }
      if (typeof defaultVal === 'boolean') return defaultVal ? 'Evet' : 'Hayır';
      return defaultVal;
    };

    const isRaceHorse = isRaceHorseAdvert(detail, categoryName);
    if (isRaceHorse) {
      list.push({
        label: 'İdmanda mı',
        value: findProp(['IN_TRAINING', 'inTraining', 'idmanda'], true) ?? 'Evet',
        icon: 'fitness-outline',
        isBoolean: true,
      });

      list.push({
        label: 'Koşar durumda mı',
        value: findProp(['IS_RACE_READY', 'isRaceReady', 'kosar', 'koşar'], true) ?? 'Evet',
        icon: 'flash-outline',
        isBoolean: true,
      });

      list.push({
        label: 'Kiralık mı',
        value: findProp(['IS_FOR_RENT', 'isForRent', 'kiralik', 'kiralık'], false) ?? 'Hayır',
        icon: 'key-outline',
        isBoolean: true,
      });
    }

    // Kısrak Gebelik Durumu
    const isPregnant = findProp(['IS_PREGNANT', 'isPregnant', 'gebe', 'gebemi', 'gebe mi'], null);
    if (isPregnant != null) {
      list.push({
        label: 'Gebe mi',
        value: isPregnant,
        icon: 'heart-outline',
        isBoolean: true,
      });

      const isPregBool = isPregnant === 'Evet' || isPregnant === 'true' || isPregnant === '1';
      if (isPregBool) {
        const coveringStallion = findProp(
          ['COVERING_STALLION', 'coveringStallion', 'gebeOlduguAygir', 'gebe oldugu aygir', 'gebe olduğu aygır', 'aygir', 'aygır'],
          '-'
        );
        list.push({
          label: 'Gebe Olduğu Aygır',
          value: coveringStallion || '-',
          icon: 'flame-outline',
          onPress:
            coveringStallion && coveringStallion !== '-'
              ? () => openTjkHorseSearch(coveringStallion)
              : undefined,
        });

        const stage = findProp(
          ['PREGNANCY_STAGE', 'pregnancyStage', 'gebelikDurumu', 'gebelik durumu', 'gebelik', 'evre'],
          '-'
        );
        list.push({
          label: 'Gebelik Durumu',
          value: stage || '-',
          icon: 'ribbon-outline',
        });

        const coveringDate = findProp(
          ['LAST_COVERING_DATE', 'lastCoveringDate', 'sonAsimTarihi', 'son aşım tarihi', 'son asim tarihi', 'aşım tarihi', 'asim tarihi', 'coveringDate'],
          '-'
        );
        list.push({
          label: 'Son Aşım Tarihi',
          value: coveringDate || '-',
          icon: 'calendar-outline',
        });
      }
    }
  }

  return list.map((item) => ({
    ...item,
    label: normalizeLabel(item.label),
    icon: item.icon || getRowIcon(item.label),
  }));
}

