import type { TjkHorseProfile, TjkHorseSummary } from '@/types/listing';

/**
 * TJK at sorgusu — GET /v1/horses
 * UI bu arayüze bağlıdır; mock / HTTP değiştirilebilir.
 */
export interface ITjkRepository {
  search(query: string, signal?: AbortSignal): Promise<TjkHorseSummary[]>;
  getById(horseId: string, signal?: AbortSignal): Promise<TjkHorseProfile | null>;
}
