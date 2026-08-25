import INITIAL_CATALOG from '@/data/catalog.json';

export type AddressFieldConfig = {
  isActive: boolean;
  isRequired: boolean;
};

let cachedDynamicConfig: AddressFieldConfig | null = null;
let isFetchingSync = false;

export function fetchDynamicAddressConfig(): void {
  if (typeof window !== 'undefined' && !isFetchingSync) {
    isFetchingSync = true;
    fetch('http://localhost:8080/api/v1/catalog/dynamic')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.categoryProperties) && data.categoryProperties.length > 0) {
          try {
            localStorage.setItem('haradan_catalog_data', JSON.stringify(data));
          } catch {}
          const addressProp = data.categoryProperties.find(
            (p: any) =>
              (p.code === 'ADDRESS' || p.code === 'address') &&
              (p.categoryId === 'c1000000-0000-4000-8000-000000000000' ||
                p.categoryId === 'ortak-alanlar' ||
                p.categoryId === 'cat-ortak-alanlar')
          );
          if (addressProp) {
            cachedDynamicConfig = {
              isActive: Boolean(addressProp.isActive && addressProp.isFormVisible !== false),
              isRequired: Boolean(addressProp.isRequired),
            };
          } else {
            cachedDynamicConfig = { isActive: false, isRequired: false };
          }
          window.dispatchEvent(new Event('haradan_catalog_data_changed'));
        }
      })
      .catch(() => {})
      .finally(() => {
        isFetchingSync = false;
      });
  }
}

if (typeof window !== 'undefined') {
  fetchDynamicAddressConfig();
  window.addEventListener('focus', fetchDynamicAddressConfig);
}

export function getAddressFieldConfig(): AddressFieldConfig {
  if (cachedDynamicConfig) {
    return cachedDynamicConfig;
  }

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

