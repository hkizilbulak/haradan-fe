import { ApiError } from '@/services/http';
import type {
  IPaymentCheckout,
  OnlineCheckoutRequest,
  OnlineCheckoutResult,
} from '@/types/payment';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * iyzico checkout — mock.
 * HTTP: POST /v1/payments/checkout → checkoutUrl
 */
export class MockPaymentCheckout implements IPaymentCheckout {
  async startOnline(
    payload: OnlineCheckoutRequest,
    _accessToken: string
  ): Promise<OnlineCheckoutResult> {
    await wait(420);
    if (!payload.draftId) {
      throw new ApiError('Ödeme başlatılamadı.', 400, 'VALIDATION');
    }
    return {
      status: 'MOCK_READY',
      checkoutUrl: null,
      message: 'iyzico test ortamı — kart ödemesi yakında bağlanacak.',
    };
  }
}
