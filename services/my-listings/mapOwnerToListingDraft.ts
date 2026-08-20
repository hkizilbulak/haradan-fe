import {
  findCategoryById,
  findCategoryParent,
} from '@/services/catalog/categoryTree';
import { createEmptyDraft } from '@/services/listing';
import { mediaDeliveryUrl } from '@/services/media/publicUrl';
import { formatTlGrouped } from '@/services/phone';
import type { CategoryTreeNode, ListingDraft } from '@/types';
import type { OwnerAdvertDto } from './mapOwnerAdvert';

/**
 * Owner advert → düzenleme formu.
 * Dinamik properties / TJK alanları BE’de ayrı tutuluyorsa burada genişletilir.
 */
export function mapOwnerToListingDraft(
  dto: OwnerAdvertDto,
  tree: CategoryTreeNode[],
  apiBase: string
): ListingDraft {
  const draft = createEmptyDraft();
  const node = dto.categoryId ? findCategoryById(tree, dto.categoryId) : null;
  const parent = node ? findCategoryParent(tree, node.id) : null;
  const media = [...(dto.media ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return {
    ...draft,
    type: node
      ? {
          categoryId: node.id,
          categorySlug: node.slug,
          categoryName: node.name,
          parentSlug: parent?.slug ?? null,
        }
      : null,
    packageCode: 'STANDARD',
    details: {
      ...draft.details,
      title: dto.title?.trim() ?? '',
      description: dto.description?.trim() ?? '',
      priceTl:
        dto.price?.amountMinor != null
          ? formatTlGrouped(String(Math.round(dto.price.amountMinor / 100)))
          : '',
      provinceId: dto.provinceId ?? null,
      districtId: dto.districtId ?? null,
      address: dto.address?.trim() ?? '',
      horseId: dto.horseId,
      tjkSkipped: !dto.horseId,
    },
    media: media.map((m, index) => ({
      localId: m.assetId,
      uri: mediaDeliveryUrl(m.assetId, 'DETAIL', apiBase),
      mimeType: 'image/jpeg',
      fileName: `${m.assetId}.jpg`,
      isCover: m.isCover || index === 0,
      assetId: m.assetId,
    })),
  };
}
