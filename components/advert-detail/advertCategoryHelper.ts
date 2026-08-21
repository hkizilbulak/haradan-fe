import type { AdvertDetail } from '@/types';

export type AdvertCategoryKind = 'pansiyon' | 'transport' | 'farrier' | 'stud' | 'horse';

export function getAdvertCategoryKind(detail: AdvertDetail): AdvertCategoryKind {
  const catId = (detail.categoryId ?? '').toLowerCase();
  const slug = (detail.slug ?? '').toLowerCase();
  const title = (detail.title ?? '').toLowerCase();
  const crumbs = detail.breadcrumbs.map((b) => b.label.toLowerCase()).join(' ');

  const text = `${catId} ${slug} ${title} ${crumbs}`;

  if (text.includes('pansiyon') || text.includes('hara')) {
    return 'pansiyon';
  }
  if (
    text.includes('nakliye') ||
    text.includes('tasima') ||
    text.includes('taşıma') ||
    text.includes('transport')
  ) {
    return 'transport';
  }
  if (text.includes('nalbant') || text.includes('farrier')) {
    return 'farrier';
  }
  if (
    text.includes('aygir') ||
    text.includes('aygır') ||
    text.includes('asim') ||
    text.includes('aşım')
  ) {
    return 'stud';
  }
  return 'horse';
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

  const age =
    specMap['yaş'] ||
    specMap['studage'] ||
    (horse.age > 0 ? `${horse.age} Yaş` : '');

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
      isSpecTrue('facilitygrasspaddock') ||
      text.includes('çim padok') ||
      text.includes('cim padok') ||
      text.includes('çim'),
    hasSandPaddock:
      isSpecTrue('kum padok') ||
      isSpecTrue('facilitysandpaddock') ||
      text.includes('kum padok') ||
      text.includes('kum'),
    hasStallionPaddock:
      isSpecTrue('aygır padoğu') ||
      isSpecTrue('facilitystallionpaddock') ||
      text.includes('aygır padoğu') ||
      text.includes('aygir padogu'),
    hasVeterinarian:
      isSpecTrue('veteriner') ||
      isSpecTrue('facilityveterinarian') ||
      text.includes('veteriner') ||
      text.includes('hekim'),
    hasFarrier:
      isSpecTrue('nalbant') ||
      isSpecTrue('facilityfarrier') ||
      text.includes('nalbant') ||
      text.includes('nal'),
    hasFoalingBarn:
      isSpecTrue('doğumhane') ||
      isSpecTrue('facilityfoalingbarn') ||
      text.includes('doğumhane') ||
      text.includes('dogumhane') ||
      text.includes('doğum'),
    trainingTrack:
      specMap['idman pisti'] ||
      specMap['facilitytrainingtrack'] ||
      (text.includes('1200m')
        ? '1200m Kum İdman Pisti'
        : text.includes('kum pist')
        ? 'Kum İdman Pisti'
        : ''),
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
