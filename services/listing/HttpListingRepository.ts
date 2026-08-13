import type {
  CreateListingRequest,
  CreateListingResponse,
  ListingPackage,
  ListingPaymentInstructions,
} from '@/types/listing';
import { HttpClient } from '@/services/http';
import type { IListingRepository } from './ListingRepository';

/** HTTP listing — EXPO_PUBLIC_USE_HTTP_LISTING=1 */
export class HttpListingRepository implements IListingRepository {
  private readonly http: HttpClient;
  private cached: ListingPackage[] | null = null;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  getCachedPackages(): ListingPackage[] | null {
    return this.cached;
  }

  async getPackages(): Promise<ListingPackage[]> {
    const items = await this.http.request<ListingPackage[]>(
      '/v1/listing-packages',
      { method: 'GET' }
    );
    this.cached = items;
    return items;
  }

  createDraft(
    payload: CreateListingRequest,
    accessToken: string
  ): Promise<CreateListingResponse> {
    return this.http.request<CreateListingResponse>('/v1/listings/drafts', {
      method: 'POST',
      body: JSON.stringify(payload),
      accessToken,
    });
  }

  getPaymentInstructions(
    draftId: string,
    accessToken: string
  ): Promise<ListingPaymentInstructions> {
    return this.http.request<ListingPaymentInstructions>(
      `/v1/listings/drafts/${encodeURIComponent(draftId)}/payment`,
      { method: 'GET', accessToken }
    );
  }
}
