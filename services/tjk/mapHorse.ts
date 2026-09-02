import type { HorseGender } from '@/types';
import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';

export type HorseSelectionItem = {
  id: string;
  originalName: string;
  tjkNumber: string;
  birthYear?: number | null;
  sireName?: string | null;
  damName?: string | null;
};

export type HorsePublicDetailResponse = HorseSelectionItem & {
  breed?: string | null;
  gender?: string | null;
  coat?: string | null;
  detail?: Record<string, unknown>;
};

export function horseSearchQuery(raw: string): {
  q?: string;
  tjkNumber?: string;
} {
  const query = raw.trim();
  if (/^\d{3,}$/.test(query)) return { tjkNumber: query };
  return { q: query };
}

export function mapTjkGender(raw: string | null | undefined): HorseGender | null {
  const value = (raw ?? '').trim().toLocaleLowerCase('tr');
  if (!value) return null;
  if (
    value === 'k' ||
    value.startsWith('kısrak') ||
    value.startsWith('kisrak') ||
    value.startsWith('dişi') ||
    value.startsWith('disi') ||
    value === 'female' ||
    value === 'f'
  ) {
    return 'Dişi';
  }
  if (
    value === 'e' ||
    value.startsWith('erkek') ||
    value.startsWith('aygır') ||
    value.startsWith('aygir') ||
    value === 'male' ||
    value === 'm'
  ) {
    return 'Erkek';
  }
  if (
    value === 'i' ||
    value.startsWith('iğdiş') ||
    value.startsWith('igdis') ||
    value === 'gelding'
  ) {
    return 'İğdiş';
  }
  return null;
}

function firstLine(raw: string | null | undefined): string {
  return (raw ?? '').split(/\r?\n/)[0]?.trim() ?? '';
}

function toIsoDate(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  const dmy = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return value;
}

function ageFromBirthYear(year: number | null | undefined): number {
  if (!year || year < 1900) return 0;
  return Math.max(0, new Date().getFullYear() - year);
}

export function mapTjkCoat(raw: string | null | undefined): string {
  const value = (raw ?? '').trim().toLocaleLowerCase('tr');
  if (!value) return '';
  if (value === 'a' || value === 'al' || value === 'chestnut' || value === 'sorrel' || value === 'ch') return 'Al';
  if (value === 'd' || value === 'doru' || value === 'bay') return 'Doru';
  if (value === 'k' || value === 'kır' || value === 'kir' || value === 'grey' || value === 'gray' || value === 'gr' || value === 'kr') return 'Kır';
  if (value === 'y' || value === 'ya' || value === 'yağız' || value === 'yagiz' || value === 'black' || value === 'bl') return 'Yağız';
  if (value === 'ka' || value === 'kestane') return 'Kestane';
  if (value === 'da' || value === 'doru al') return 'Doru Al';
  if (value === 'b' || value === 'beyaz' || value === 'white' || value === 'wh' || value === 'ak') return 'Beyaz';
  if (value === 'ku' || value === 'kula' || value === 'dun' || value === 'buckskin') return 'Kula';
  if (value === 'boz' || value === 'roan' || value === 'grullo') return 'Boz';
  return (raw ?? '').trim();
}

export function mapHorseSelection(item: HorseSelectionItem): TjkHorseSummary {
  return {
    horseId: item.id,
    tjkNumber: item.tjkNumber,
    registeredName: item.originalName,
    birthYear: item.birthYear ?? null,
    gender: null,
    breed: '',
    coatColor: '',
    sireName: item.sireName ?? null,
    damName: item.damName ?? null,
  };
}

export function mapHorseDetail(item: HorsePublicDetailResponse): TjkHorseProfile {
  const detail = item.detail && typeof item.detail === 'object' ? item.detail : {};
  const profile =
    detail.profile && typeof detail.profile === 'object'
      ? (detail.profile as Record<string, unknown>)
      : {};

  const rawBirthDate =
    typeof profile.birthDate === 'string' ? profile.birthDate : undefined;
  const birthDate = toIsoDate(rawBirthDate);
  const owner = typeof profile.owner === 'string' ? profile.owner.trim() : '';
  const grower = typeof profile.grower === 'string' ? profile.grower.trim() : '';
  const maidenSire =
    typeof profile.maidenSire === 'string' ? profile.maidenSire.trim() : '';
  const ageText =
    typeof profile.ageText === 'string' ? profile.ageText.trim() : '';
  const sourceName =
    typeof profile.sourceName === 'string' ? profile.sourceName.trim() : '';
  const handicapPoint =
    typeof profile.handicapPoint === 'string'
      ? profile.handicapPoint.trim()
      : typeof profile.handicapPoint === 'number'
        ? String(profile.handicapPoint)
        : '';
  const profileEarning =
    typeof profile.earning === 'string' ? profile.earning.trim() : '';

  const parsedHandicap = handicapPoint ? parseInt(handicapPoint, 10) : null;
  const handicap = Number.isFinite(parsedHandicap) ? parsedHandicap : null;

  // 1. Pedigree Parsing
  const rawPedigree = Array.isArray(detail.pedigree) ? detail.pedigree : [];
  const pedigree = rawPedigree
    .map((p: any) => {
      if (!p || typeof p !== 'object') return null;
      const father = String(p.Father ?? p.father ?? '').trim();
      const mother = String(p.Mother ?? p.mother ?? '').trim();
      if (!father && !mother) return null;
      return { father, mother };
    })
    .filter((p): p is { father: string; mother: string } => p !== null);

  // 2. Siblings (Anne Kardeşleri) Parsing
  const rawSiblings = Array.isArray(detail.siblings) ? detail.siblings : [];
  const siblings = rawSiblings
    .map((s: any) => {
      if (!s || typeof s !== 'object') return null;
      const name = String(s.Name ?? s.name ?? '').trim();
      if (!name) return null;
      return {
        name,
        fatherName: String(s.FatherName ?? s.fatherName ?? '').trim(),
        raceCount: String(s.RaceCount ?? s.raceCount ?? '0').trim(),
        first: String(s.First ?? s.first ?? '0').trim(),
        second: String(s.Second ?? s.second ?? '0').trim(),
        third: String(s.Third ?? s.third ?? '0').trim(),
        fourth: String(s.Fourth ?? s.fourth ?? '0').trim(),
        earning: String(s.Earning ?? s.earning ?? '0').trim(),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  // 3. Statistics (Koşu ve Pist İstatistikleri) Parsing
  const rawStats = Array.isArray(detail.statistics) ? detail.statistics : [];
  const statistics = rawStats
    .map((st: any) => {
      if (!st || typeof st !== 'object') return null;
      const rawYearLabel = String(st.YearLabel ?? st.yearLabel ?? '').trim();
      if (!rawYearLabel) return null;
      const cleaned = rawYearLabel
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
      const rawLower = rawYearLabel.toLowerCase().trim();

      let yearLabel = rawYearLabel;
      if (cleaned === 'sen' || cleaned.startsWith('sen') || rawLower.startsWith('sen')) yearLabel = 'Sentetik';
      else if (cleaned === 'cim' || cleaned.startsWith('cim') || rawLower.startsWith('çim')) yearLabel = 'Çim';
      else if (cleaned === 'kum' || cleaned.startsWith('kum') || rawLower.startsWith('kum')) yearLabel = 'Kum';
      else if (cleaned.includes('toplam') || rawLower.includes('toplam')) yearLabel = 'Genel Toplam';

      return {
        yearLabel,
        raceCount: String(st.RaceCount ?? st.raceCount ?? '0').trim(),
        first: String(st.First ?? st.first ?? '0').trim(),
        second: String(st.Second ?? st.second ?? '0').trim(),
        third: String(st.Third ?? st.third ?? '0').trim(),
        fourth: String(st.Fourth ?? st.fourth ?? '0').trim(),
        fifth: String(st.Fifth ?? st.fifth ?? '0').trim(),
        earning: String(st.Earning ?? st.earning ?? '0').trim(),
      };
    })
    .filter((st): st is NonNullable<typeof st> => st !== null);

  const summary = mapHorseSelection(item);

  return {
    ...summary,
    gender: mapTjkGender(item.gender),
    breed: firstLine(item.breed),
    coatColor: mapTjkCoat(item.coat),
    birthDate: birthDate || rawBirthDate || '',
    age: ageFromBirthYear(item.birthYear),
    heightCm: null,
    sire: item.sireName ?? (pedigree[0]?.father || ''),
    dam: item.damName ?? (pedigree[0]?.mother || ''),
    damsire: maidenSire || (pedigree[2]?.father || ''),
    owners: owner ? [owner] : [],
    breeder: grower || (typeof profile.breeder === 'string' ? profile.breeder : ''),
    trainer: typeof profile.trainer === 'string' ? profile.trainer : '',
    handicap,
    pedigree: pedigree.length > 0 ? pedigree : undefined,
    siblings: siblings.length > 0 ? siblings : undefined,
    statistics: statistics.length > 0 ? statistics : undefined,
    detailProfile: {
      sourceName: sourceName || undefined,
      ageText: ageText || undefined,
      birthDate: rawBirthDate || birthDate || undefined,
      handicapPoint: handicapPoint || undefined,
      maidenSire: maidenSire || undefined,
      owner: owner || undefined,
      grower: grower || undefined,
      earning: profileEarning || undefined,
    },
  };
}
