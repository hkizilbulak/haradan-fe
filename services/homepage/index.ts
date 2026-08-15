export type { IHomepageRepository, HomepageQueryOptions } from './HomepageRepository';
export { createCachedHomepageRepository } from './CachedHomepageRepository';
export { MockHomepageRepository } from './MockHomepageRepository';
export { HttpHomepageRepository } from './HttpHomepageRepository';
export { createHomepageRepository } from './createHomepageRepository';
import { createHomepageRepository } from './createHomepageRepository';
import type { IHomepageRepository } from './HomepageRepository';

/** Uygulama genelinde kullanılan varsayılan repository örneği. */
export const homepageRepository: IHomepageRepository =
  createHomepageRepository();
