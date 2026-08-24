import { useEffect, useState } from 'react';
import { catalogRepository } from '@/services/catalog';
import type { CategoryPropertyPublic } from '@/types';

/**
 * Seçili kategorinin filterable property'lerini backend'den çeker.
 * Filter sidebar ve quick filters tarafından kullanılır.
 */
export function useFilterableProperties(
  categorySlug: string | null | undefined
): CategoryPropertyPublic[] {
  const [properties, setProperties] = useState<CategoryPropertyPublic[]>([]);

  useEffect(() => {
    if (!categorySlug) {
      setProperties([]);
      return;
    }

    let cancelled = false;

    catalogRepository
      .getCategoryFormDefinition(categorySlug, {
        fresh: true,
        categorySlug,
      } as any)
      .then((def) => {
        if (cancelled) return;
        if (def && Array.isArray(def.properties)) {
          setProperties(
            def.properties.filter(
              (p: CategoryPropertyPublic) => p.isFilterable !== false
            )
          );
        } else {
          setProperties([]);
        }
      })
      .catch(() => {
        if (!cancelled) setProperties([]);
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  return properties;
}
