import { ApiError, HttpClient } from '@/services/http';
import { getAuthSession } from '@/services/auth/sessionStore';
import type { AdvertDetail } from '@/types';
import type { OwnerAdvertDto } from '@/services/my-listings/mapOwnerAdvert';
import type { AdvertQueryOptions, IAdvertRepository } from './AdvertRepository';
import {
  mapOwnerToAdvertDetail,
  mapPublishedDetailToAdvert,
  type BePublishedAdvertDetail,
} from './mapAdvertDetail';
import { createCachedAdvertRepository } from './CachedAdvertRepository';

/**
 * PUBLIC detail first; on miss/failure with a session, owner read.
 * Owner path covers drafts and transient public projection failures.
 */
export class HttpAdvertRepository implements IAdvertRepository {
  private readonly http: HttpClient;

  constructor(private readonly baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  getCached(_id: string): AdvertDetail | null {
    return null;
  }

  async getById(
    id: string,
    options?: AdvertQueryOptions
  ): Promise<AdvertDetail> {
    const accessToken =
      options?.accessToken ?? getAuthSession()?.accessToken ?? null;
    const viewerUserId =
      options?.viewerUserId ?? getAuthSession()?.user.id ?? null;

    let publicError: unknown = null;
    try {
      const dto = await this.http.request<BePublishedAdvertDetail>(
        `/v1/adverts/${encodeURIComponent(id)}`,
        {
          method: 'GET',
          ...(accessToken ? { accessToken } : null),
        }
      );
      const owned =
        accessToken && viewerUserId
          ? await this.isOwned(id, accessToken)
          : false;
      return mapPublishedDetailToAdvert(
        dto,
        this.baseUrl,
        owned ? viewerUserId : null
      );
    } catch (err) {
      publicError = err;
      if (!accessToken) throw err;
    }

    try {
      const owner = await this.http.request<OwnerAdvertDto>(
        `/v1/me/adverts/${encodeURIComponent(id)}`,
        { method: 'GET', accessToken: accessToken! }
      );
      return mapOwnerToAdvertDetail(owner, this.baseUrl, viewerUserId ?? '');
    } catch (ownerErr) {
      if (
        ownerErr instanceof ApiError &&
        ownerErr.status === 404 &&
        publicError instanceof ApiError
      ) {
        throw publicError;
      }
      throw ownerErr;
    }
  }

  private async isOwned(id: string, accessToken: string): Promise<boolean> {
    try {
      await this.http.request<OwnerAdvertDto>(
        `/v1/me/adverts/${encodeURIComponent(id)}`,
        { method: 'GET', accessToken }
      );
      return true;
    } catch {
      return false;
    }
  }
}

export function createHttpAdvertRepository(baseUrl: string): IAdvertRepository {
  return createCachedAdvertRepository(new HttpAdvertRepository(baseUrl));
}
