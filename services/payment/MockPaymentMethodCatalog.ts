import type { IPaymentMethodCatalog, PaymentMethod } from '@/types/payment';

const METHODS: PaymentMethod[] = [
  {
    code: 'IYZICO_CARD',
    provider: 'iyzico',
    label: 'Kart ile öde',
    description: 'Visa, Mastercard · iyzico',
    icon: 'card-outline',
  },
  {
    code: 'IYZICO_WALLET',
    provider: 'iyzico',
    label: 'iyzico',
    description: 'Cüzdan ve kayıtlı kart',
    icon: 'wallet-outline',
  },
  {
    code: 'BANK_TRANSFER',
    provider: 'whatsapp',
    label: 'Havale ile öde',
    description: 'IBAN + WhatsApp dekont',
    icon: 'swap-horizontal-outline',
  },
];

export class MockPaymentMethodCatalog implements IPaymentMethodCatalog {
  list(): PaymentMethod[] {
    return METHODS;
  }

  listOnline(): PaymentMethod[] {
    return METHODS.filter((m) => m.provider === 'iyzico');
  }
}

export const paymentMethodCatalog: IPaymentMethodCatalog =
  new MockPaymentMethodCatalog();
