import { MOCK_TJK_HORSES } from '@/mocks/tjkHorses';
import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';
import type { ITjkRepository } from './TjkRepository';
import { horseSearchQuery } from './mapHorse';

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

function toSummary(h: TjkHorseProfile): TjkHorseSummary {
  return {
    horseId: h.horseId,
    tjkNumber: h.tjkNumber,
    registeredName: h.registeredName,
    birthYear: h.birthYear,
    gender: h.gender,
    breed: h.breed,
    coatColor: h.coatColor,
    sireName: h.sire || null,
    damName: h.dam || null,
  };
}

export class MockTjkRepository implements ITjkRepository {
  async search(query: string, signal?: AbortSignal): Promise<TjkHorseSummary[]> {
    await wait(160, signal);
    const params = horseSearchQuery(query);
    if (params.tjkNumber) {
      return MOCK_TJK_HORSES.filter((h) => h.tjkNumber === params.tjkNumber).map(
        toSummary
      );
    }
    const q = (params.q ?? '').toLocaleLowerCase('tr');
    if (q.length < 2) return [];
    return MOCK_TJK_HORSES.filter((h) =>
      h.registeredName.toLocaleLowerCase('tr').includes(q)
    ).map(toSummary);
  }

  async getById(
    horseId: string,
    signal?: AbortSignal
  ): Promise<TjkHorseProfile | null> {
    await wait(120, signal);
    return (
      MOCK_TJK_HORSES.find((h) => h.horseId === horseId || h.tjkNumber === horseId) ??
      null
    );
  }
}
