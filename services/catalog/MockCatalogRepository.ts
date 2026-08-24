import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryPropertyPublic,
  CategoryTreeNode,
} from '@/types';
import { MOCK_CATEGORIES } from '@/mocks/homepage';
import type { CatalogQueryOptions, ICatalogRepository } from './CatalogRepository';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';
import {
  HORSE_BREED_OPTIONS,
  HORSE_AGE_OPTIONS,
  HORSE_GENDER_OPTIONS,
  COAT_COLOR_OPTIONS,
  STUD_BREED_OPTIONS,
  STUD_AGE_OPTIONS,
  PANSIYON_FACILITY_OPTIONS,
} from '@/components/listings/filterConfig';

const HORSE_PROPERTIES: CategoryPropertyPublic[] = [
  {
    code: 'HORSE_BREED',
    title: 'At Irkı',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 1,
    options: HORSE_BREED_OPTIONS.map((b) => ({ value: b, label: b })),
  },
  {
    code: 'COAT_COLOR',
    title: 'Donu (Renk)',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 2,
    options: COAT_COLOR_OPTIONS.map((c) => ({ value: c, label: c })),
  },
  {
    code: 'HORSE_AGE',
    title: 'Yaş',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 3,
    options: HORSE_AGE_OPTIONS.map((a) => ({ value: a, label: a })),
  },
  {
    code: 'HORSE_GENDER',
    title: 'Cinsiyet',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 4,
    options: HORSE_GENDER_OPTIONS.map((g) => ({ value: g, label: g })),
  },
];


const PANSIYON_PROPERTIES: CategoryPropertyPublic[] = PANSIYON_FACILITY_OPTIONS.map(
  (fac, idx) => ({
    code: fac.key,
    title: fac.label,
    dataType: 'BOOLEAN' as const,
    isRequired: false,
    isFilterable: true,
    sortOrder: idx + 1,
    options: [],
  })
);

const STUD_PROPERTIES: CategoryPropertyPublic[] = [
  {
    code: 'STALLION_BREED',
    title: 'At Irkı',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 1,
    options: STUD_BREED_OPTIONS.map((b) => ({ value: b, label: b })),
  },
  {
    code: 'STALLION_AGE',
    title: 'Yaş',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 2,
    options: STUD_AGE_OPTIONS.map((a) => ({ value: a, label: a })),
  },
  {
    code: 'COAT_COLOR',
    title: 'Donu (Renk)',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 3,
    options: COAT_COLOR_OPTIONS.map((c) => ({ value: c, label: c })),
  },
];

export class MockCatalogRepository implements ICatalogRepository {
  getCachedFacets(): CatalogFacets | null {
    return null;
  }

  getCachedCategoryTree(): CategoryTreeNode[] | null {
    return null;
  }

  invalidate(): void {}

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    return MOCK_CATEGORIES;
  }

  async getFacets(): Promise<CatalogFacets> {
    const tree = await this.getCategoryTree();
    return mapCategoryTreeToFacets(tree);
  }

  async getCategoryFormDefinition(
    categoryId: string,
    options?: CatalogQueryOptions & { categorySlug?: string }
  ): Promise<CategoryFormDefinitionResponse | null> {
    if (!categoryId && !options?.categorySlug) return null;

    const targetId = categoryId || options?.categorySlug || '';
    const targetSlug = options?.categorySlug || categoryId || '';

    // 1. Check browser localStorage for real-time changes from BO
    if (typeof window !== 'undefined') {
      try {
        const candidateKeys = [
          targetId,
          targetSlug,
          `cat-${targetId}`,
          `cat-${targetSlug}`,
          targetId.replace(/^cat-/, ''),
          targetSlug.replace(/^cat-/, ''),
        ];

        for (const k of candidateKeys) {
          if (!k) continue;
          const stored = localStorage.getItem(`haradan_category_properties_${k}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const activeProps: CategoryPropertyPublic[] = parsed
                .filter(
                  (p: any) =>
                    p.isActive !== false &&
                    p.is_active !== false &&
                    p.active !== false &&
                    p.isFormVisible !== false &&
                    p.is_form_visible !== false
                )
                .map((p: any) => ({
                  code: p.code || p.id,
                  title: p.title,
                  helpText: p.helpText,
                  dataType: p.dataType,
                  isRequired: Boolean(p.isRequired),
                  isFilterable: p.isFilterable !== false && p.is_filterable !== false,
                  isFormVisible: p.isFormVisible !== false && p.is_form_visible !== false,
                  isPublicVisible: p.isPublicVisible !== false && p.is_public_visible !== false,
                  isActive: true,
                  sortOrder: p.sortOrder || 1,
                  options: p.options || [],
                }));
              const tSlug = (targetSlug || targetId).toLowerCase();
              let baseList = HORSE_PROPERTIES;
              if (tSlug.includes('pansiyon')) baseList = PANSIYON_PROPERTIES;
              else if (tSlug.includes('asim') || tSlug.includes('aygir') || tSlug.includes('stud')) baseList = STUD_PROPERTIES;
              else if (tSlug.includes('nakliye') || tSlug.includes('transport')) baseList = [];
              else if (tSlug.includes('nalbant') || tSlug.includes('farrier')) baseList = [];

              const existingCodes = new Set(activeProps.map((p) => (p.code || p.title).toLowerCase()));
              for (const defProp of baseList) {
                const defKey = (defProp.code || defProp.title).toLowerCase();
                if (!existingCodes.has(defKey)) {
                  activeProps.push(defProp);
                }
              }
              activeProps.sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));

              return {
                categoryId: targetId,
                slug: targetSlug,
                name: targetSlug,
                properties: activeProps,
              };
            }
          }
        }
      } catch {}
    }

    const cid = (categoryId || '').toLowerCase();
    let props = HORSE_PROPERTIES;
    let slug = 'satilik-yaris-ati';
    let name = 'Satılık Yarış Atı';

    if (cid.includes('pansiyon')) {
      props = PANSIYON_PROPERTIES;
      slug = 'pansiyon-haralar';
      name = 'Pansiyon Haralar';
    } else if (cid.includes('asim') || cid.includes('aygir') || cid.includes('stud')) {
      props = STUD_PROPERTIES;
      slug = cid.includes('arap') ? 'arap-aygir' : 'ingiliz-aygir';
      name = cid.includes('arap') ? 'Arap Aygır' : 'İngiliz Aygır';
    } else if (cid.includes('nakliye') || cid.includes('transport')) {
      props = [
        {
          code: 'COMPANY_NAME',
          title: 'Firma Adı',
          dataType: 'STRING',
          isRequired: true,
          isFilterable: false,
          sortOrder: 1,
          options: [],
        },
        {
          code: 'WEBSITE_URL',
          title: 'Web Sitesi',
          dataType: 'STRING',
          isRequired: false,
          isFilterable: false,
          sortOrder: 2,
          options: [],
        },
      ];
      slug = 'at-nakliyesi';
      name = 'At Nakliyesi';
    } else if (cid.includes('nalbant') || cid.includes('farrier')) {
      props = [];
      slug = 'nalbantlar';
      name = 'Nalbantlar';
    }

    return {
      categoryId: categoryId || 'cat-satilik-yaris-ati',
      slug,
      name,
      properties: props,
    };
  }
}

