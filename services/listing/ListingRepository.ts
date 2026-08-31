import type {
  ListingDraft,
  ListingPackage,
  PublishListingResult,
} from '@/types/listing';
import type { AdvertId } from '@/types/advertId';
import type { PaytrChargeStatus, PaytrCheckoutResult } from '@/types/paytr';

/**
 * İlan taslağı + paketler + PayTR checkout.
 */
export interface IListingRepository {
  getPackages(): Promise<ListingPackage[]>;
  getCachedPackages(): ListingPackage[] | null;
  createDraft?(
    draft: ListingDraft,
    accessToken: string
  ): Promise<{ advertId: AdvertId; version: number; status: string }>;
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
