import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { ILocationLookup } from './LocationLookup';
import { HttpLocationLookup } from './HttpLocationLookup';
import { StaticLocationLookup } from './StaticLocationLookup';

export function createLocationLookup(): ILocationLookup {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_GEO)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpLocationLookup(baseUrl);
  }
  return new StaticLocationLookup();
}

export const locationLookup: ILocationLookup = createLocationLookup();
