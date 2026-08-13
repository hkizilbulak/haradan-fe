import { HttpClient } from '@/services/http';
import type {
  IPaymentCheckout,
  OnlineCheckoutRequest,
  OnlineCheckoutResult,
} from '@/types/payment';

/** POST /v1/payments/checkout — EXPO_PUBLIC_USE_HTTP_PAYMENTS=1 */
export class HttpPaymentCheckout implements IPaymentCheckout {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  startOnline(
    payload: OnlineCheckoutRequest,
    accessToken: string
  ): Promise<OnlineCheckoutResult> {
    return this.http.request<OnlineCheckoutResult>('/v1/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
      accessToken,
    });
  }
}
