import type { AdvertDetail } from '@/types';

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
    text.includes('cat-asim') ||
    text.includes('cat-arap-aygir') ||
    text.includes('cat-ingiliz-aygir')
  ) {
    return 'stud';
  }
  return 'horse';
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

  const gender =
    (horse?.gender && (horse.gender as string) !== '-' ? horse.gender : '') ||
    getProp(['cinsiyet', 'gender', 'horsegender']) ||
    '-';

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

  return { name, breed, age, coatColor, sire, dam, damsire };
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
