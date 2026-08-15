import { ApiError, HttpClient } from '@/services/http';
import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';
import type { ITjkRepository } from './TjkRepository';
import {
  horseSearchQuery,
  mapHorseDetail,
  mapHorseSelection,
  type HorsePublicDetailResponse,
  type HorseSelectionItem,
} from './mapHorse';

type HorseSelectionListResponse = { items: HorseSelectionItem[] };

/** HORSE-01/02 — GET /v1/horses */
export class HttpTjkRepository implements ITjkRepository {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async search(query: string, signal?: AbortSignal): Promise<TjkHorseSummary[]> {
    const params = horseSearchQuery(query);
    if (!params.q && !params.tjkNumber) return [];
    const search = new URLSearchParams();
    if (params.tjkNumber) search.set('tjkNumber', params.tjkNumber);
    if (params.q) search.set('q', params.q);
    search.set('limit', '20');
    const res = await this.http.request<HorseSelectionListResponse>(
      `/v1/horses?${search.toString()}`,
      { method: 'GET', signal }
    );
    return (res.items ?? []).map(mapHorseSelection);
  }

  async getById(
    horseId: string,
    signal?: AbortSignal
  ): Promise<TjkHorseProfile | null> {
    try {
      const detail = await this.http.request<HorsePublicDetailResponse>(
        `/v1/horses/${encodeURIComponent(horseId)}`,
        { method: 'GET', signal }
      );
      return mapHorseDetail(detail);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }
}
