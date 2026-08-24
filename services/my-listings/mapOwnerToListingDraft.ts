import {
  findCategoryById,
  findCategoryParent,
} from '@/services/catalog/categoryTree';
import { createEmptyDraft } from '@/services/listing';
import { mediaDeliveryUrl } from '@/services/media/publicUrl';
import { formatTlGrouped, parseInternationalPhone } from '@/services/phone';
import { getAuthSession } from '@/services/auth/sessionStore';
import type { CategoryTreeNode, HorseGender, ListingDraft } from '@/types';
import type { OwnerAdvertDto } from './mapOwnerAdvert';

/**
 * Owner advert → düzenleme formu.
 * Dinamik properties, telefon ve kategoriye özel alanları ListingDraft'a eksiksiz aktarır.
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

  const props = dto.properties || {};

  // Telefon numarasını properties.sellerPhone -> properties.phone -> session user phone sırasıyla çözümle
  const rawPhone =
    (typeof props.sellerPhone === 'string' && props.sellerPhone.trim()) ||
    (typeof props.phone === 'string' && props.phone.trim()) ||
    getAuthSession()?.user?.phone ||
    '';

  const parsedPhone = rawPhone
    ? parseInternationalPhone(rawPhone)
    : { iso: 'TR', national: '' };

  const parsedGender =
    props.gender === 'Erkek' || props.gender === 'Dişi' || props.gender === 'İğdiş'
      ? (props.gender as HorseGender)
      : null;

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
    packageCode: (dto.packageCode as ListingDraft['packageCode']) || 'STANDARD',
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
      phoneCountryIso: parsedPhone.iso || 'TR',
      sellerPhone: parsedPhone.national || '',

      // TJK dışı / ek at özellikleri
      gender: parsedGender,
      birthDate:
        typeof props.birthDate === 'string' ? props.birthDate : draft.details.birthDate,
      age:
        props.age != null ? String(props.age) : draft.details.age,
      coatColor:
        typeof props.coatColor === 'string' ? props.coatColor : draft.details.coatColor,
      heightCm:
        props.heightCm != null ? String(props.heightCm) : draft.details.heightCm,
      sire: typeof props.sire === 'string' ? props.sire : draft.details.sire,
      dam: typeof props.dam === 'string' ? props.dam : draft.details.dam,
      damsire:
        typeof props.damsire === 'string' ? props.damsire : draft.details.damsire,
      registeredName:
        typeof props.registeredName === 'string'
          ? props.registeredName
          : draft.details.registeredName,
      ownersText:
        typeof props.ownersText === 'string'
          ? props.ownersText
          : draft.details.ownersText,
      breeder:
        typeof props.breeder === 'string' ? props.breeder : draft.details.breeder,
      trainer:
        typeof props.trainer === 'string' ? props.trainer : draft.details.trainer,

      properties: { ...props },
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
