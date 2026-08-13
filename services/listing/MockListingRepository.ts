import { PAYMENTS_BANK, PAYMENTS_WHATSAPP } from '@/constants/Payments';
import { ApiError } from '@/services/http';
import type {
  CreateListingRequest,
  CreateListingResponse,
  ListingPackage,
  ListingPaymentInstructions,
} from '@/types/listing';
import type { IListingRepository } from './ListingRepository';
import { LISTING_PACKAGES } from './listingPackages';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type StoredDraft = {
  payload: CreateListingRequest;
  createdAt: string;
};

export class MockListingRepository implements IListingRepository {
  private readonly drafts = new Map<string, StoredDraft>();

  getCachedPackages(): ListingPackage[] | null {
    return LISTING_PACKAGES;
  }

  async getPackages(): Promise<ListingPackage[]> {
    await wait(80);
    return LISTING_PACKAGES;
  }

  async createDraft(
    payload: CreateListingRequest,
    _accessToken: string
  ): Promise<CreateListingResponse> {
    await wait(280);
    if (!payload.title.trim() || !payload.categoryId || !payload.packageCode) {
      throw new ApiError('Eksik ilan bilgisi.', 400, 'VALIDATION');
    }
    const draftId = `draft-${Date.now().toString(36)}`;
    this.drafts.set(draftId, {
      payload,
      createdAt: new Date().toISOString(),
    });
    return { draftId, status: 'PENDING_PAYMENT' };
  }

  async getPaymentInstructions(
    draftId: string,
    _accessToken: string
  ): Promise<ListingPaymentInstructions> {
    await wait(160);
    const stored = this.drafts.get(draftId);
    if (!stored) {
      throw new ApiError('Taslak bulunamadı.', 404, 'NOT_FOUND');
    }
    const pkg = LISTING_PACKAGES.find(
      (p) => p.code === stored.payload.packageCode
    );
    if (!pkg) {
      throw new ApiError('Paket bulunamadı.', 400, 'NOT_FOUND');
    }
    const ref = draftId.replace('draft-', 'HRD').toUpperCase();
    return {
      draftId,
      bankName: PAYMENTS_BANK.bankName,
      accountHolder: PAYMENTS_BANK.accountHolder,
      iban: PAYMENTS_BANK.iban,
      referenceCode: ref,
      whatsappPhone: PAYMENTS_WHATSAPP,
      amount: pkg.price,
      packageName: pkg.name,
      listingTitle: stored.payload.title,
    };
  }
}
