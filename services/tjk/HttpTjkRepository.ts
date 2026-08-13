import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';
import { HttpClient } from '@/services/http';
import type { ITjkRepository } from './TjkRepository';

/** GET /v1/tjk/horses — EXPO_PUBLIC_USE_HTTP_TJK=1 */
export class HttpTjkRepository implements ITjkRepository {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  search(query: string, signal?: AbortSignal): Promise<TjkHorseSummary[]> {
    const q = encodeURIComponent(query.trim());
    return this.http.request<TjkHorseSummary[]>(`/v1/tjk/horses?q=${q}`, {
      method: 'GET',
      signal,
    });
  }

  getById(
    tjkId: string,
    signal?: AbortSignal
  ): Promise<TjkHorseProfile | null> {
    return this.http.request<TjkHorseProfile | null>(
      `/v1/tjk/horses/${encodeURIComponent(tjkId)}`,
      { method: 'GET', signal }
    );
  }
}
