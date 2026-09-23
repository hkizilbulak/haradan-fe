import type { AdvertDetail } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { openTjkHorseSearch } from '@/utils/tjkLinks';

export type AdvertCategoryKind = 'pansiyon' | 'transport' | 'farrier' | 'service' | 'stud' | 'horse';

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
  if (
    text.includes('hizmet') ||
    text.includes('servis') ||
    text.includes('service') ||
    text.includes('at-hizmetleri') ||
    text.includes('ekipman') ||
    text.includes('ahir') ||
    text.includes('tesis') ||
    catId === 'c1000000-0000-4000-8000-000000000002' ||
    catId === 'c1000000-0000-4000-8000-000000000004' ||
    catId === 'c1000000-0000-4000-8000-000000000005'
  ) {
    return 'service';
  }
  return 'horse';
}

import { CATEGORY_NAMES_BY_ID_OR_SLUG } from '@/constants/listingCatalog';
export { CATEGORY_NAMES_BY_ID_OR_SLUG };

export function getAdvertCategoryName(detail?: AdvertDetail | null): string {
  if (!detail) return '';
  const rawCatId = (detail.categoryId ?? '').trim();
  const knownName =
    CATEGORY_NAMES_BY_ID_OR_SLUG[rawCatId] ||
    CATEGORY_NAMES_BY_ID_OR_SLUG[rawCatId.toLowerCase()];

  // Filter breadcrumbs to find real category label, skipping root, 'İlanlarım', and the advert title
  const categoryCrumb = (detail.breadcrumbs ?? [])
    .filter((b) => {
      const href = (b.href ?? '').toLowerCase();
      const label = (b.label ?? '').trim().toLowerCase();
      return (
        href !== '/' &&
        href !== '/my-listings' &&
        label !== 'ana sayfa' &&
        label !== 'ilanlarım' &&
        label !== 'ilanlarim' &&
        label !== (detail.title ?? '').trim().toLowerCase()
      );
    })
    .pop()?.label;

  const resolvedName =
    (detail as any)?.category?.name ||
    knownName ||
    categoryCrumb;

  if (
    resolvedName &&
    resolvedName.toLowerCase() !== 'ilanlarım' &&
    resolvedName.toLowerCase() !== 'ilanlarim'
  ) {
    return resolvedName;
  }

  const kind = getAdvertCategoryKind(detail);
  if (kind === 'farrier') return 'Nalbantlar';
  if (kind === 'transport') return 'At Nakliyesi';
  if (kind === 'pansiyon') return 'Pansiyon Haralar';
  if (kind === 'stud') return 'Aşım Hizmetleri';
  return 'Satılık Yarış Atı';
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

  const propName = getProp(['atadi', 'aygiradi', 'isim', 'registeredname', 'horsename', 'studhorsename', 'studhorse']);
  const name =
    (propName && propName !== 'Başlıksız ilan' && propName !== '-')
      ? propName
      : (horse?.registeredName && horse.registeredName !== 'Başlıksız ilan' && horse.registeredName !== '-'
        ? horse.registeredName
        : title || '-');

  const propSire = getProp(['baba', 'sire', 'babaadi', 'babasire', 'studsire']);
  const sire = (propSire && propSire !== '-')
    ? propSire
    : (horse?.sire && horse.sire !== '-' ? horse.sire : '-');

  const propDam = getProp(['anne', 'dam', 'anneadi', 'annedam', 'studdam']);
  const dam = (propDam && propDam !== '-')
    ? propDam
    : (horse?.dam && horse.dam !== '-' ? horse.dam : '-');

  const propDamsire = getProp([
    'annesininbabasi',
    'kisrakbabasi',
    'damsire',
    'studdamsire',
    'anneninbabasidamsire',
    'anneninbabasi',
  ]);
  const damsire = (propDamsire && propDamsire !== '-')
    ? propDamsire
    : (horse?.damsire && horse.damsire !== '-' ? horse.damsire : '-');

  const propBreed = getProp(['atirki', 'irk', 'ırk', 'safkan', 'breed', 'horsebreed', 'studbreed', 'stallionbreed']);
  const breed = (propBreed && propBreed !== 'Bilinmiyor' && propBreed !== '-')
    ? propBreed
    : (horse?.breed && horse.breed !== 'Bilinmiyor' && horse.breed !== '-' ? horse.breed : 'İngiliz');

  const categoryKind = getAdvertCategoryKind(detail);
  const isStud =
    categoryKind === 'stud' ||
    Boolean(getProp(['studbreed', 'stallionbreed', 'studhorse', 'studhorsename', 'studsire', 'studdam', 'studage', 'studcoatcolor']));

  const propGender = getProp(['cinsiyet', 'gender', 'horsegender']);
  const gender = (propGender && propGender !== '-')
    ? propGender
    : (horse?.gender && (horse.gender as string) !== '-' ? horse.gender : (isStud ? 'Erkek' : '-'));

  const propCoatColor = getProp(['donu', 'don', 'donurenk', 'coatcolor', 'studcoatcolor']);
  const coatColor = (propCoatColor && propCoatColor !== 'Bilinmiyor' && propCoatColor !== '-')
    ? propCoatColor
    : (horse?.coatColor && horse.coatColor !== 'Bilinmiyor' && horse.coatColor !== '-' ? horse.coatColor : '-');

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

function normalizePansiyonKey(str: string): string {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_\s]/g, '');
}

export function parsePansiyonInfo(detail: AdvertDetail): ParsedPansiyonInfo {
  const isTruthy = (v: unknown): boolean => {
    if (v === true) return true;
    if (v === false || v == null) return false;
    const s = String(v).trim().toLowerCase();
    return (
      s === 'true' ||
      s === 'evet' ||
      s === 'var' ||
      s === 'mevcut' ||
      s === '1' ||
      (s !== '' && s !== 'hayır' && s !== 'hayir' && s !== 'false' && s !== '0' && s !== 'yok')
    );
  };

  const isExplicitlyFalse = (v: unknown): boolean => {
    if (v === false) return true;
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === 'hayır' || s === 'hayir' || s === 'false' || s === '0' || s === 'yok';
  };

  const map: Record<string, unknown> = {};

  // 1. Read from properties / rawProperties
  const rawProps = (detail as any).properties || (detail as any).rawProperties || {};
  if (Array.isArray(rawProps)) {
    for (const p of rawProps) {
      if (!p) continue;
      if (p.code) map[normalizePansiyonKey(p.code)] = p.value ?? p.displayValue;
      if (p.title) map[normalizePansiyonKey(p.title)] = p.displayValue ?? p.value;
    }
  } else if (typeof rawProps === 'object') {
    for (const [k, v] of Object.entries(rawProps)) {
      map[normalizePansiyonKey(k)] = v;
    }
  }

  // 2. Read from specs
  (detail.specs ?? []).forEach((g) => {
    g.rows.forEach((r) => {
      map[normalizePansiyonKey(r.label)] = r.value;
    });
  });

  const checkKeys = (keys: string[]): boolean | null => {
    for (const k of keys) {
      const nk = normalizePansiyonKey(k);
      if (map[nk] !== undefined) {
        if (isTruthy(map[nk])) return true;
        if (isExplicitlyFalse(map[nk])) return false;
      }
    }
    return null;
  };

  const text = `${detail.title || ''} ${detail.description || ''}`.toLowerCase();

  const resolveBool = (keys: string[], textKeywords: string[]): boolean => {
    const keyResult = checkKeys(keys);
    if (keyResult !== null) return keyResult;
    return textKeywords.some((w) => text.includes(w));
  };

  const grass = resolveBool(
    ['çim padok', 'grasspaddock', 'facilitygrasspaddock'],
    ['çim padok', 'cim padok']
  );
  const sand = resolveBool(
    ['kum padok', 'sandpaddock', 'facilitysandpaddock'],
    ['kum padok']
  );
  const stallion = resolveBool(
    ['aygır padoğu', 'aygir padogu', 'stallionpaddock', 'facilitystallionpaddock'],
    ['aygır padoğu', 'aygir padogu']
  );
  const vet = resolveBool(
    ['veteriner', 'veteriner hekim', 'vet', 'veterinarian', 'facilityveterinarian'],
    ['veteriner hekim', 'veteriner']
  );
  const farrier = resolveBool(
    ['nalbant', 'farrier', 'facilityfarrier'],
    ['nalbant']
  );
  const foaling = resolveBool(
    ['doğumhane', 'dogumhane', 'foalingbarn', 'facilityfoalingbarn', 'maternity'],
    ['doğumhane', 'dogumhane']
  );
  const track = resolveBool(
    ['idman pisti', 'idmanpisti', 'trainingtrack', 'facilitytrainingtrack'],
    ['idman pisti']
  );

  const rawTrackVal =
    map[normalizePansiyonKey('idman pisti')] ??
    map[normalizePansiyonKey('trainingtrack')] ??
    map[normalizePansiyonKey('facilitytrainingtrack')];
  const trackStr = rawTrackVal != null && typeof rawTrackVal !== 'boolean' ? String(rawTrackVal) : '';

  return {
    hasGrassPaddock: grass,
    hasSandPaddock: sand,
    hasStallionPaddock: stallion,
    hasVeterinarian: vet,
    hasFarrier: farrier,
    hasFoalingBarn: foaling,
    hasTrainingTrack: track,
    trainingTrack: trackStr,
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
  if (l.includes('sıcak') || l.includes('sicak')) return 'flame-outline';
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

    const seenNormKeys = new Set<string>([
      'cimpadok', 'kumpadok', 'aygirpadogu', 'dogumhane', 'nalbant', 'veteriner', 'veterinerhekim', 'idmanpisti',
      'grasspaddock', 'sandpaddock', 'stallionpaddock', 'foalingbarn', 'farrier', 'veterinarian', 'trainingtrack', 'maternity', 'vet',
      'facilitygrasspaddock', 'facilitysandpaddock', 'facilitystallionpaddock', 'facilityfoalingbarn', 'facilityfarrier', 'facilityveterinarian', 'facilitytrainingtrack',
      'telefon', 'sellerphone', 'phone'
    ]);
    for (const group of detail.specs ?? []) {
      for (const row of group.rows ?? []) {
        const l = row.label.trim();
        const norm = normalizePansiyonKey(l);
        if (seenNormKeys.has(norm)) continue;
        const v = String(row.value).trim();
        if (!v) continue;
        const isBool = v.toLowerCase() === 'evet' || v.toLowerCase() === 'hayır' || v.toLowerCase() === 'true' || v.toLowerCase() === 'false';
        const formattedVal = v.toLowerCase() === 'true' ? 'Evet' : v.toLowerCase() === 'false' ? 'Hayır' : v;
        list.push({
          label: l.charAt(0).toLocaleUpperCase('tr-TR') + l.slice(1),
          value: formattedVal,
          icon: getRowIcon(l),
          isBoolean: isBool,
        });
        seenNormKeys.add(norm);
      }
    }
  } else if (categoryKind === 'transport') {
    const transportInfo = parseTransportInfo(detail);
    if (transportInfo.companyName) {
      list.push({ label: 'Firma Adı', value: transportInfo.companyName, icon: 'business-outline' });
    }
    if (transportInfo.websiteUrl) {
      list.push({ label: 'Web Sitesi', value: transportInfo.websiteUrl, icon: 'globe-outline' });
    }
    list.push({ label: 'Hizmet', value: 'At Nakliyesi & Taşımacılık', icon: 'car-outline' });

    const seenLabels = new Set<string>([
      'firma adı', 'web sitesi', 'hizmet', 'companyname', 'websiteurl', 'telefon', 'sellerphone', 'phone'
    ]);
    for (const group of detail.specs ?? []) {
      for (const row of group.rows ?? []) {
        const l = row.label.trim();
        const lower = l.toLowerCase();
        const norm = lower.replace(/[-_\s]/g, '');
        if (seenLabels.has(lower) || seenLabels.has(norm)) continue;
        const v = String(row.value).trim();
        if (!v) continue;
        const isBool = v.toLowerCase() === 'evet' || v.toLowerCase() === 'hayır' || v.toLowerCase() === 'true' || v.toLowerCase() === 'false';
        const formattedVal = v.toLowerCase() === 'true' ? 'Evet' : v.toLowerCase() === 'false' ? 'Hayır' : v;
        list.push({
          label: l.charAt(0).toLocaleUpperCase('tr-TR') + l.slice(1),
          value: formattedVal,
          icon: getRowIcon(l),
          isBoolean: isBool,
        });
        seenLabels.add(lower);
        seenLabels.add(norm);
      }
    }
  } else if (categoryKind === 'stud') {
    const studInfo = parseStudInfo(detail);
    if (studInfo.name) {
      list.push({
        label: 'Aygır Adı',
        value: studInfo.name,
        icon: 'star-outline',
        onPress: () => openTjkHorseSearch(studInfo.name, detail.horse?.tjkNumber),
      });
    }
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
    const propMap: Record<string, any> = (detail as any).properties || (detail as any).rawProperties || {};
    const specMap: Record<string, string> = {};
    (detail.specs ?? []).forEach((g) => {
      g.rows.forEach((r) => {
        specMap[r.label.toLowerCase()] = r.value;
      });
    });
    const rawHot = propMap.SICAK_UYGULAMA ?? propMap.sicakUygulama ?? propMap.sicak_uygulama ?? propMap['sıcak uygulama'] ?? propMap['sicak'] ?? specMap['sıcak uygulama'] ?? specMap['sicak uygulama'] ?? specMap['sıcak'] ?? specMap['sicak'];
    const isHotShoeing = rawHot === true || rawHot === 'true' || rawHot === 'Evet' || rawHot === 1 || rawHot === '1';
    list.push({
      label: 'Sıcak Uygulama',
      value: isHotShoeing ? 'Evet' : 'Hayır',
      icon: 'flame-outline',
      isBoolean: true,
    });
    list.push({ label: 'Hizmet Türü', value: 'Nalbantlar', icon: 'hammer-outline' });

    const seenLabels = new Set<string>([
      'sıcak uygulama', 'sicak uygulama', 'sicak_uygulama', 'sicakuygulama', 'hizmet türü', 'hizmetturu', 'telefon', 'phone', 'sellerphone'
    ]);
    for (const group of detail.specs ?? []) {
      for (const row of group.rows ?? []) {
        const l = row.label.trim();
        const lower = l.toLowerCase();
        if (seenLabels.has(lower) || seenLabels.has(lower.replace(/[-_\s]/g, ''))) continue;
        const v = String(row.value).trim();
        if (!v) continue;
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
  } else if (categoryKind === 'service') {
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
      onPress: horseInfo.name && horseInfo.name !== '-' ? () => openTjkHorseSearch(horseInfo.name, detail.horse?.tjkNumber) : undefined,
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

    const findBooleanProp = (codes: string[], defaultVal: boolean | null = null): string | null => {
      const rawProps = (detail as any)?.properties || (detail as any)?.rawProperties || {};
      const normCodes = codes.map(normText);

      const toBooleanString = (val: unknown): string | null => {
        if (val === true || val === 1) return 'Evet';
        if (val === false || val === 0) return 'Hayır';
        if (typeof val === 'string') {
          const s = val.trim().toLowerCase();
          if (s === 'true' || s === 'evet' || s === '1') return 'Evet';
          if (s === 'false' || s === 'hayır' || s === 'hayir' || s === '0') return 'Hayır';
        }
        return null;
      };

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
        const res = toBooleanString(val);
        if (res != null) return res;
      }

      for (const [k, val] of Object.entries(rawProps)) {
        const kNorm = normText(k);
        if (normCodes.includes(kNorm)) {
          const res = toBooleanString(val);
          if (res != null) return res;
        }
      }

      for (const g of detail.specs ?? []) {
        for (const r of g.rows ?? []) {
          const lNorm = normText(r.label || '');
          if (normCodes.includes(lNorm)) {
            const res = toBooleanString(r.value);
            if (res != null) return res;
          }
        }
      }

      if (defaultVal === null) return null;
      return defaultVal ? 'Evet' : 'Hayır';
    };

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
          if (normCodes.some((c) => kNorm === c || (kNorm.length >= 4 && c.length >= 4 && (kNorm.startsWith(c) || c.startsWith(kNorm))))) {
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
            if (normCodes.some((c) => lNorm === c || (lNorm.length >= 4 && c.length >= 4 && (lNorm.startsWith(c) || c.startsWith(lNorm))))) {
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
        value: findBooleanProp(['IN_TRAINING', 'inTraining', 'idmanda', 'idmandaMi', 'idmanda_mi'], false)!,
        icon: 'fitness-outline',
        isBoolean: true,
      });

      list.push({
        label: 'Koşar durumda mı',
        value: findBooleanProp(['IS_RACE_READY', 'isRaceReady', 'kosar', 'koşar', 'kosarDurumdaMi', 'kosardurumda'], false)!,
        icon: 'flash-outline',
        isBoolean: true,
      });

      list.push({
        label: 'Kiralık mı',
        value: findBooleanProp(['IS_FOR_RENT', 'isForRent', 'kiralik', 'kiralık', 'kiralikMi', 'kiralik_mi'], false)!,
        icon: 'key-outline',
        isBoolean: true,
      });
    }

    // Kısrak Gebelik Durumu
    const isPregnant = findBooleanProp(['IS_PREGNANT', 'isPregnant', 'gebe', 'gebemi', 'gebe mi'], null);
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

