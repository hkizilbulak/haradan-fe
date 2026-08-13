import type { PublishedAdvertCard } from './advert';
import type {
  BlogVideoItem,
  BrandItem,
  CatalogProductCard,
  MacPromo,
  SalePromo,
} from './catalog';

/** OpenAPI: HomepageShowcaseResponse */
export type HomepageShowcaseResponse = {
  seed: string;
  items: PublishedAdvertCard[];
};

/**
 * Ana sayfa aggregate — BE endpoint'leri + UI-only bloklar.
 */
export type HomepageData = {
  banners: import('./banner').ActiveBannerItem[];
  categories: import('./category').CategoryTreeNode[];
  showcase: HomepageShowcaseResponse;
  newAdverts: CatalogProductCard[];
  trending: CatalogProductCard[];
  specialOffers: CatalogProductCard[];
  urgentAdverts: CatalogProductCard[];
  macPromo: MacPromo;
  salePromo: SalePromo;
  brands: BrandItem[];
  blogVideos: BlogVideoItem[];
};
