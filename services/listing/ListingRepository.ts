import type {
  ListingDraft,
  ListingPackage,
  PublishListingResult,
} from '@/types/listing';
import type { AdvertId } from '@/types/advertId';
import type { PaytrChargeStatus, PaytrCheckoutResult } from '@/types/paytr';
import type { DraftPersistResult } from './HttpListingRepository';

/**
 * İlan taslağı + paketler + PayTR checkout.
 * Wizard: persistDraftShell (details→package) → background media → finalize.
 */
export interface IListingRepository {
  getPackages(): Promise<ListingPackage[]>;
  getCachedPackages(): ListingPackage[] | null;
  /** Details→package: create/update + properties; starts background media. */
  persistDraftShell?(
    draft: ListingDraft,
    accessToken: string
  ): Promise<DraftPersistResult>;
  /** Await background media pipeline for advert (if any). */
  awaitMediaPipeline?(
    advertId: AdvertId
  ): Promise<{ version: number; mediaVersion: number } | null>;
  createDraft?(
    draft: ListingDraft,
    accessToken: string
  ): Promise<DraftPersistResult>;
  startPaytrCheckout?(
    advertId: AdvertId,
    packageCode: string,
    accessToken: string
  ): Promise<PaytrCheckoutResult>;
  getPaytrChargeStatus?(
    advertId: AdvertId,
    merchantOid: string,
    accessToken: string
  ): Promise<PaytrChargeStatus>;
  publish(
    draft: ListingDraft,
    accessToken: string
  ): Promise<PublishListingResult>;
}
