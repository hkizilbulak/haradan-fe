export type PaytrCheckoutResult = {
  chargeId: string;
  merchantOid: string;
  iframeToken: string;
  iframeUrl: string;
  amountMinor: number;
  currencyCode: string;
  packageCode: string;
  advertId: string;
  status: string;
};

export type PaytrChargeStatus = {
  merchantOid: string;
  advertId: string;
  packageCode: string;
  amountMinor: number;
  currencyCode: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | string;
  paidAt?: string | null;
  advertSubmittedAt?: string | null;
};
