import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';

/**
 * TJK at sorgusu — GET /v1/tjk/horses
 * UI bu arayüze bağlıdır; mock / HTTP değiştirilebilir.
 */
export interface ITjkRepository {
  search(query: string, signal?: AbortSignal): Promise<TjkHorseSummary[]>;
  getById(tjkId: string, signal?: AbortSignal): Promise<TjkHorseProfile | null>;
}
