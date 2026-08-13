import type { IPaymentCheckout } from '@/types/payment';
import { HttpPaymentCheckout } from './HttpPaymentCheckout';
import { MockPaymentCheckout } from './MockPaymentCheckout';

export function createPaymentCheckout(): IPaymentCheckout {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_PAYMENTS === '1';
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (useHttp && baseUrl) return new HttpPaymentCheckout(baseUrl);
  return new MockPaymentCheckout();
}

export const paymentCheckout: IPaymentCheckout = createPaymentCheckout();
