import { MOCK_TJK_HORSES } from '@/mocks/tjkHorses';
import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';
import type { ITjkRepository } from './TjkRepository';

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
    tjkId: h.tjkId,
    registeredName: h.registeredName,
    birthYear: h.birthYear,
    gender: h.gender,
    breed: h.breed,
    coatColor: h.coatColor,
  };
}

export class MockTjkRepository implements ITjkRepository {
  async search(query: string, signal?: AbortSignal): Promise<TjkHorseSummary[]> {
    await wait(160, signal);
    const q = query.trim().toLocaleLowerCase('tr');
    if (q.length < 2) return [];
    return MOCK_TJK_HORSES.filter((h) =>
      h.registeredName.toLocaleLowerCase('tr').includes(q)
    ).map(toSummary);
  }

  async getById(
    tjkId: string,
    signal?: AbortSignal
  ): Promise<TjkHorseProfile | null> {
    await wait(120, signal);
    return MOCK_TJK_HORSES.find((h) => h.tjkId === tjkId) ?? null;
  }
}
