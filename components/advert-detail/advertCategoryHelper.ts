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
  const desc = detail.description;

  const specMap: Record<string, string> = {};
  (detail.specs ?? []).forEach((g) => {
    g.rows.forEach((r) => {
      specMap[r.label.toLowerCase()] = r.value;
    });
  });

  const name =
    specMap['aygır adı'] ||
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
      : 'Safkan İngiliz');

  const age =
    specMap['yaş'] ||
    specMap['studage'] ||
    (horse.age > 0 ? `${horse.age} Yaş` : '7 Yaş');

  const coatColor =
    specMap['don'] ||
    specMap['donu'] ||
    specMap['studcoatcolor'] ||
    (horse.coatColor && horse.coatColor !== 'Bilinmiyor'
      ? horse.coatColor
      : '') ||
    (desc.toLowerCase().includes('doru')
      ? 'Doru'
      : desc.toLowerCase().includes('al')
      ? 'Al'
      : desc.toLowerCase().includes('kır')
      ? 'Kır'
      : 'Doru');

  const sire =
    specMap['baba'] ||
    specMap['baba (sire)'] ||
    specMap['studsire'] ||
    (horse.sire && horse.sire !== 'Bilinmiyor' ? horse.sire : '') ||
    (desc.includes('LUXOR') ? 'LUXOR' : desc.includes('ÖZGÜNHAN') ? 'ÖZGÜNHAN' : '—');

  const dam =
    specMap['anne'] ||
    specMap['anne (dam)'] ||
    specMap['studdam'] ||
    (horse.dam && horse.dam !== 'Bilinmiyor' ? horse.dam : '') ||
    (desc.includes('QUEEN OF SPADES') ? 'QUEEN OF SPADES' : '—');

  const damsire =
    specMap['annesinin babası'] ||
    specMap['kısrak babası'] ||
    specMap['studdamsire'] ||
    (horse.damsire && horse.damsire !== 'Bilinmiyor' ? horse.damsire : '') ||
    (desc.includes('UNACCOUNTED FOR') ? 'UNACCOUNTED FOR' : '—');

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
  const text = `${detail.title} ${detail.description} ${JSON.stringify(
    detail.specs ?? []
  )}`.toLowerCase();

  return {
    hasGrassPaddock:
      text.includes('çim') ||
      text.includes('cim') ||
      text.includes('grass') ||
      text.includes('padok'),
    hasSandPaddock: text.includes('kum') || text.includes('sand'),
    hasStallionPaddock:
      text.includes('aygır') ||
      text.includes('aygir') ||
      text.includes('stallion'),
    hasVeterinarian:
      text.includes('veteriner') ||
      text.includes('hekim') ||
      text.includes('saglik') ||
      text.includes('sağlık'),
    hasFarrier: text.includes('nalbant') || text.includes('nal'),
    hasFoalingBarn:
      text.includes('doğum') ||
      text.includes('dogum') ||
      text.includes('kısrak') ||
      text.includes('kisrak'),
    trainingTrack: text.includes('1200m')
      ? '1200m Kum İdman Pisti'
      : text.includes('kum pist')
      ? 'Kum İdman Pisti'
      : 'Mevcut',
  };
}

export type ParsedTransportInfo = {
  companyName: string;
  route: string;
  hasCamera: boolean;
  hasAirSuspension: boolean;
  hasInsurance: boolean;
};

export function parseTransportInfo(detail: AdvertDetail): ParsedTransportInfo {
  const text = `${detail.title} ${detail.description} ${JSON.stringify(
    detail.specs ?? []
  )}`.toLowerCase();

  return {
    companyName: detail.title.includes('—')
      ? detail.title.split('—')[0].trim()
      : 'Lider At Taşımacılık',
    route: text.includes('adana')
      ? 'İstanbul / İzmir / Adana Hattı'
      : 'Tüm Türkiye & Hipodromlar Arası',
    hasCamera: text.includes('kamera') || text.includes('izleme'),
    hasAirSuspension:
      text.includes('havalı') ||
      text.includes('süspansiyon') ||
      text.includes('suspansiyon'),
    hasInsurance: text.includes('sigorta') || text.includes('sigortalı'),
  };
}
