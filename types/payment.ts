export type PaymentProvider = 'whatsapp' | 'iyzico';

export type PaymentMethodCode =
  | 'BANK_TRANSFER'
  | 'IYZICO_CARD'
  | 'IYZICO_WALLET';

export type PaymentMethod = {
  code: PaymentMethodCode;
  provider: PaymentProvider;
  label: string;
  description: string;
  icon: string;
};

export type OnlineCheckoutRequest = {
  draftId: string;
  methodCode: PaymentMethodCode;
  amountMinor: number;
  currency: string;
};

export type OnlineCheckoutResult = {
  status: 'REDIRECT' | 'MOCK_READY' | 'FAILED';
  checkoutUrl: string | null;
  message: string;
};

export interface IPaymentMethodCatalog {
  list(): PaymentMethod[];
  listOnline(): PaymentMethod[];
}

export interface IPaymentCheckout {
  startOnline(
    payload: OnlineCheckoutRequest,
    accessToken: string
  ): Promise<OnlineCheckoutResult>;
}
