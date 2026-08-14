import { resolveApiBaseUrl } from '@/services/http';
import type { IPaymentCheckout } from '@/types/payment';
import { HttpPaymentCheckout } from './HttpPaymentCheckout';
import { MockPaymentCheckout } from './MockPaymentCheckout';

export function createPaymentCheckout(): IPaymentCheckout {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_PAYMENTS === '1';
  const baseUrl = resolveApiBaseUrl();
  if (useHttp && baseUrl) return new HttpPaymentCheckout(baseUrl);
  return new MockPaymentCheckout();
}

export const paymentCheckout: IPaymentCheckout = createPaymentCheckout();
