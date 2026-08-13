import { useMemo } from 'react';
import {
  paymentMethodCatalog,
  type IPaymentMethodCatalog,
} from '@/services/payment';

export function usePaymentMethods(
  catalog: IPaymentMethodCatalog = paymentMethodCatalog
) {
  return useMemo(
    () => ({
      all: catalog.list(),
      online: catalog.listOnline(),
    }),
    [catalog]
  );
}
