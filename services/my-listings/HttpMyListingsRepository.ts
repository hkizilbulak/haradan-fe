import { HttpClient } from '@/services/http';
import type {
  ListingDraft,
  MyListingCard,
  MyListingListResponse,
  MyListingStatus,
  UpdateListingRequest,
} from '@/types';
import type { IMyListingsRepository } from './MyListingsRepository';

/** HTTP — EXPO_PUBLIC_USE_HTTP_MY_LISTINGS=1 */
export class HttpMyListingsRepository implements IMyListingsRepository {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  list(
    status: MyListingStatus,
    accessToken: string
  ): Promise<MyListingListResponse> {
    return this.http.request<MyListingListResponse>(
      `/v1/me/listings?status=${encodeURIComponent(status)}`,
      { method: 'GET', accessToken }
    );
  }

  getEditDraft(id: string, accessToken: string): Promise<ListingDraft> {
    return this.http.request<ListingDraft>(
      `/v1/me/listings/${encodeURIComponent(id)}/edit`,
      { method: 'GET', accessToken }
    );
  }

  update(
    id: string,
    payload: UpdateListingRequest,
    accessToken: string
  ): Promise<MyListingCard> {
    return this.http.request<MyListingCard>(
      `/v1/me/listings/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
        accessToken,
      }
    );
  }
}
