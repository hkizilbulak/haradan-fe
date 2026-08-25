import INITIAL_CATALOG from '@/data/catalog.json';

export type AddressFieldConfig = {
  isActive: boolean;
  isRequired: boolean;
};

export function getAddressFieldConfig(): AddressFieldConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('haradan_catalog_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.categoryProperties)) {
          const addressProp = parsed.categoryProperties.find(
            (p: any) =>
              (p.code === 'ADDRESS' || p.code === 'address') &&
              (p.categoryId === 'c1000000-0000-4000-8000-000000000000' ||
                p.categoryId === 'ortak-alanlar' ||
                p.categoryId === 'cat-ortak-alanlar')
          );
          if (addressProp) {
            return {
              isActive: Boolean(addressProp.isActive && addressProp.isFormVisible !== false),
              isRequired: Boolean(addressProp.isRequired),
            };
          }
          // If the property was deleted from the global category in BO:
          return { isActive: false, isRequired: false };
        }
      }
    } catch {}
  }

  // Fallback to initial catalog
  const initialAddress = (INITIAL_CATALOG as any)?.categoryProperties?.find(
    (p: any) =>
      (p.code === 'ADDRESS' || p.code === 'address') &&
      (p.categoryId === 'c1000000-0000-4000-8000-000000000000' ||
        p.categoryId === 'ortak-alanlar')
  );
  if (initialAddress) {
    return {
      isActive: Boolean(initialAddress.isActive && initialAddress.isFormVisible !== false),
      isRequired: Boolean(initialAddress.isRequired),
    };
  }

  return { isActive: true, isRequired: true };
}

