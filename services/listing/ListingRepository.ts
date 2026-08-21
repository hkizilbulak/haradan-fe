import type {
  ListingDraft,
  ListingPackage,
  PublishListingResult,
} from '@/types/listing';
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
  ): Promise<{ advertId: string; version: number; status: string }>;
  startPaytrCheckout?(
    advertId: string,
    packageCode: string,
    accessToken: string
  ): Promise<PaytrCheckoutResult>;
  getPaytrChargeStatus?(
    advertId: string,
    merchantOid: string,
    accessToken: string
  ): Promise<PaytrChargeStatus>;
  publish(
    draft: ListingDraft,
    accessToken: string
  ): Promise<PublishListingResult>;
}
