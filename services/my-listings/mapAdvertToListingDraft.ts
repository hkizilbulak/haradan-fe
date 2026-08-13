import {
  findCategoryById,
  findCategoryParent,
} from '@/services/catalog/categoryTree';
import { createEmptyDraft } from '@/services/listing';
import { formatTlGrouped, parseInternationalPhone } from '@/services/phone';
import type { AdvertDetail, CategoryTreeNode, ListingDraft } from '@/types';
import type { MyListingCard } from '@/types/myListings';

/**
 * Detay aggregate → ilan formu (düzenleme).
 * BE edit DTO’su gelince mapper burada değişir; UI ListingDraft kullanır.
 */
export function mapAdvertToListingDraft(
  detail: AdvertDetail,
  card: MyListingCard,
  tree: CategoryTreeNode[]
): ListingDraft {
  const draft = createEmptyDraft();
  const node = findCategoryById(tree, card.categoryId);
  const parent = node ? findCategoryParent(tree, node.id) : null;
  const horse = detail.horse;

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
    breed: card.brand
      ? { id: `breed-${card.brand}`, slug: card.brand, label: card.brand }
      : null,
    packageCode: (card.packageCode as ListingDraft['packageCode']) ?? 'STANDARD',
    details: {
      ...draft.details,
      title: detail.title,
      description: detail.description,
      priceTl:
        detail.price?.amountMinor != null
          ? formatTlGrouped(String(Math.round(detail.price.amountMinor / 100)))
          : '',
      provinceId: detail.provinceId,
      gender: horse.gender,
      birthDate: horse.birthDate,
      age: String(horse.age),
      coatColor: horse.coatColor,
      heightCm: horse.heightCm != null ? String(horse.heightCm) : '',
      sire: horse.sire,
      dam: horse.dam,
      damsire: horse.damsire,
      registeredName: horse.registeredName,
      tjkId: null,
      tjkSkipped: true,
      ownersText: horse.owners.join(', '),
      breeder: horse.breeder,
      trainer: horse.trainer,
      phoneCountryIso: detail.sellerPhone
        ? parseInternationalPhone(detail.sellerPhone).iso
        : 'TR',
      sellerPhone: detail.sellerPhone
        ? parseInternationalPhone(detail.sellerPhone).national
        : '',
    },
    media: (detail.gallery.length > 0 ? detail.gallery : [detail.cover].filter(Boolean)).map(
      (item, index) => ({
        localId: item!.assetId,
        uri: item!.publicUrl,
        mimeType: 'image/jpeg',
        fileName: `${item!.assetId}.jpg`,
        isCover: item!.isCover || index === 0,
        assetId: item!.assetId,
      })
    ),
  };
}
