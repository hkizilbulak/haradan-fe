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
  const profile =
    item.detail && typeof item.detail.profile === 'object' && item.detail.profile
      ? (item.detail.profile as Record<string, unknown>)
      : {};
  const birthDate = toIsoDate(
    typeof profile.birthDate === 'string' ? profile.birthDate : undefined
  );
  const owner = typeof profile.owner === 'string' ? profile.owner : '';
  const damsire =
    typeof profile.maidenSire === 'string' ? profile.maidenSire : '';
  const summary = mapHorseSelection(item);
  return {
    ...summary,
    gender: mapTjkGender(item.gender),
    breed: firstLine(item.breed),
    coatColor: (item.coat ?? '').trim(),
    birthDate,
    age: ageFromBirthYear(item.birthYear),
    heightCm: null,
    sire: item.sireName ?? '',
    dam: item.damName ?? '',
    damsire,
    owners: owner ? [owner] : [],
    breeder: '',
    trainer: '',
    handicap: null,
  };
}
