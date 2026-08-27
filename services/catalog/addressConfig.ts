import INITIAL_CATALOG from '@/data/catalog.json';

export type AddressFieldConfig = {
  isActive: boolean;
  isRequired: boolean;
};

export type GlobalPropertyFieldConfig = {
  code: string;
  title: string;
  isActive: boolean;
  isRequired: boolean;
  isFormVisible: boolean;
  isPublicVisible: boolean;
};

export type GlobalPropertiesMap = Record<string, GlobalPropertyFieldConfig>;

const DEFAULT_GLOBAL_CONFIGS: GlobalPropertiesMap = {
  ADDRESS: {
    code: 'ADDRESS',
    title: 'Açık Adres',
    isActive: true,
    isRequired: true,
    isFormVisible: true,
    isPublicVisible: true,
  },
  DESCRIPTION: {
    code: 'DESCRIPTION',
    title: 'İlan Açıklaması',
    isActive: true,
    isRequired: false,
    isFormVisible: true,
    isPublicVisible: true,
  },
  PRICE: {
    code: 'PRICE',
    title: 'İlan Fiyatı',
    isActive: true,
    isRequired: true,
    isFormVisible: true,
    isPublicVisible: true,
  },
  LOCATION: {
    code: 'LOCATION',
    title: 'İl ve İlçe (Konum)',
    isActive: true,
    isRequired: true,
    isFormVisible: true,
    isPublicVisible: true,
  },
  PHONE: {
    code: 'PHONE',
    title: 'İletişim Telefonu',
    isActive: true,
    isRequired: true,
    isFormVisible: true,
    isPublicVisible: true,
  },
};

let liveGlobalPropertiesCache: GlobalPropertiesMap | null = null;

export function setGlobalPropertiesConfig(newConfig: GlobalPropertiesMap): void {
  if (typeof window === 'undefined') {
    return; // SSR sırasında Node.js process ortamında cross-request mutasyonu engelle
  }

  liveGlobalPropertiesCache = { ...newConfig };

  try {
    const stored = localStorage.getItem('haradan_catalog_data');
    let catalogData: any = {};
    if (stored) {
      try {
        catalogData = JSON.parse(stored) || {};
      } catch {
        catalogData = {};
      }
    }
    const existingProps = Array.isArray(catalogData.categoryProperties)
      ? catalogData.categoryProperties.filter(
          (p: any) =>
            p.categoryId !== 'c1000000-0000-4000-8000-000000000000' &&
            p.categoryId !== 'ortak-alanlar' &&
            p.categoryId !== 'cat-ortak-alanlar'
        )
      : [];

    for (const [code, cfg] of Object.entries(newConfig)) {
      existingProps.push({
        id: `prop-global-${code.toLowerCase()}`,
        categoryId: 'c1000000-0000-4000-8000-000000000000',
        code: cfg.code,
        title: cfg.title,
        dataType:
          code === 'PRICE'
            ? 'DECIMAL'
            : code === 'ADDRESS' || code === 'DESCRIPTION'
              ? 'TEXT'
              : 'STRING',
        isRequired: cfg.isRequired,
        isActive: cfg.isActive,
        isFormVisible: cfg.isFormVisible,
        isPublicVisible: cfg.isPublicVisible,
        isFilterable: code === 'PRICE' || code === 'LOCATION',
      });
    }
    catalogData.categoryProperties = existingProps;
    localStorage.setItem('haradan_catalog_data', JSON.stringify(catalogData));
    window.dispatchEvent(new Event('haradan_global_properties_changed'));
  } catch {}
}

export function getGlobalPropertiesConfig(): GlobalPropertiesMap {
  if (typeof window === 'undefined') {
    // SSR ortamında daima deterministik varsayılanları dön (Hydration mismatch #418 koruması)
    return { ...DEFAULT_GLOBAL_CONFIGS };
  }

  if (liveGlobalPropertiesCache) {
    return { ...liveGlobalPropertiesCache };
  }

  const result: GlobalPropertiesMap = { ...DEFAULT_GLOBAL_CONFIGS };

  const isGlobalCategory = (catId: string) =>
    catId === 'c1000000-0000-4000-8000-000000000000' ||
    catId === 'ortak-alanlar' ||
    catId === 'cat-ortak-alanlar';

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('haradan_catalog_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.categoryProperties)) {
          const globalProps = parsed.categoryProperties.filter((p: any) =>
            isGlobalCategory(p.categoryId)
          );
          if (globalProps.length > 0) {
            for (const p of globalProps) {
              const code = String(p.code || '').toUpperCase();
              if (code) {
                result[code] = {
                  code,
                  title: p.title || code,
                  isActive: Boolean(p.isActive !== false && p.is_active !== false),
                  isRequired: Boolean(p.isRequired || p.is_required),
                  isFormVisible: Boolean(p.isFormVisible !== false && p.is_form_visible !== false),
                  isPublicVisible: Boolean(p.isPublicVisible !== false && p.is_public_visible !== false),
                };
              }
            }
            return result;
          }
        }
      }
    } catch {}
  }

  // Fallback to initial catalog
  const initialProps = (INITIAL_CATALOG as any)?.categoryProperties?.filter((p: any) =>
    isGlobalCategory(p.categoryId)
  );
  if (initialProps && Array.isArray(initialProps)) {
    for (const p of initialProps) {
      const code = String(p.code || '').toUpperCase();
      if (code) {
        result[code] = {
          code,
          title: p.title || code,
          isActive: Boolean(p.isActive !== false),
          isRequired: Boolean(p.isRequired),
          isFormVisible: Boolean(p.isFormVisible !== false),
          isPublicVisible: Boolean(p.isPublicVisible !== false),
        };
      }
    }
  }

  return result;
}

export function getGlobalPropertyConfig(code: string): GlobalPropertyFieldConfig {
  const all = getGlobalPropertiesConfig();
  const upper = code.toUpperCase();
  return (
    all[upper] ??
    DEFAULT_GLOBAL_CONFIGS[upper] ?? {
      code: upper,
      title: code,
      isActive: true,
      isRequired: false,
      isFormVisible: true,
      isPublicVisible: true,
    }
  );
}

export function getAddressFieldConfig(): AddressFieldConfig {
  const cfg = getGlobalPropertyConfig('ADDRESS');
  return {
    isActive: Boolean(cfg.isActive && cfg.isFormVisible),
    isRequired: Boolean(cfg.isRequired),
  };
}

