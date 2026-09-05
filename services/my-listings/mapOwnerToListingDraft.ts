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

  // Telefon numarasını properties.sellerPhone -> properties.phone -> DTO sellerPhone -> session user phone -> localStorage sırasıyla çözümle
  const rawPhone =
    (typeof props.sellerPhone === 'string' && props.sellerPhone.trim()) ||
    (typeof props.phone === 'string' && props.phone.trim()) ||
    (typeof props.seller_phone === 'string' && props.seller_phone.trim()) ||
    (typeof props.contactPhone === 'string' && props.contactPhone.trim()) ||
    (typeof (dto as Record<string, unknown>).sellerPhone === 'string' &&
      ((dto as Record<string, unknown>).sellerPhone as string).trim()) ||
    getAuthSession()?.user?.phone ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('haradan.lastSellerPhone')
      : null) ||
    '';

  if (rawPhone && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('haradan.lastSellerPhone', rawPhone);
    } catch {}
  }

  const parsedPhone = rawPhone
    ? parseInternationalPhone(rawPhone)
    : { iso: 'TR', national: '' };

  const rawGender =
    (typeof props.HORSE_GENDER === 'string' && props.HORSE_GENDER.trim()) ||
    (typeof props.gender === 'string' && props.gender.trim()) ||
    (typeof props.cinsiyet === 'string' && props.cinsiyet.trim()) ||
    '';

  const parsedGender =
    rawGender === 'Erkek' || rawGender === 'Dişi' || rawGender === 'İğdiş'
      ? (rawGender as HorseGender)
      : rawGender.toLowerCase().startsWith('e')
        ? ('Erkek' as HorseGender)
        : rawGender.toLowerCase().startsWith('d')
          ? ('Dişi' as HorseGender)
          : rawGender.toLowerCase().startsWith('i') || rawGender.toLowerCase().startsWith('ı')
            ? ('İğdiş' as HorseGender)
            : null;


  return {
    ...draft,
    type: node
      ? {
          categoryId: node.id,
          categorySlug: node.slug,
          categoryName: node.name,
          parentSlug: parent?.slug ?? null,
          allowTjk: Boolean(node.allowTjk),
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

      // Kategori: Pansiyon Haralar
      facilityGrassPaddock: Boolean(props.facilityGrassPaddock),
      facilitySandPaddock: Boolean(props.facilitySandPaddock),
      facilityStallionPaddock: Boolean(props.facilityStallionPaddock),
      facilityTrainingTrack: Boolean(props.facilityTrainingTrack ?? props.trainingTrack),
      facilityVeterinarian: Boolean(props.facilityVeterinarian),
      facilityFarrier: Boolean(props.facilityFarrier),
      facilityFoalingBarn: Boolean(props.facilityFoalingBarn),

      // Kategori: At Nakliyesi
      companyName:
        typeof props.companyName === 'string' ? props.companyName : '',
      websiteUrl: typeof props.websiteUrl === 'string' ? props.websiteUrl : '',

      // Kategori: Aşım Hizmetleri
      studBreed: typeof props.studBreed === 'string' ? props.studBreed : '',
      studAge:
        typeof props.studAge === 'string'
          ? props.studAge
          : typeof props.STALLION_AGE === 'string'
            ? props.STALLION_AGE
            : props.age != null
              ? String(props.age)
              : '',
      studCoatColor:
        typeof props.studCoatColor === 'string'
          ? props.studCoatColor
          : typeof props.coatColor === 'string'
            ? props.coatColor
            : '',
      studHorseName:
        typeof props.studHorseName === 'string'
          ? props.studHorseName
          : typeof props.registeredName === 'string'
            ? props.registeredName
            : '',
      studSire:
        typeof props.studSire === 'string'
          ? props.studSire
          : typeof props.sire === 'string'
            ? props.sire
            : '',
      studDam:
        typeof props.studDam === 'string'
          ? props.studDam
          : typeof props.dam === 'string'
            ? props.dam
            : '',
      studDamsire:
        typeof props.studDamsire === 'string'
          ? props.studDamsire
          : typeof props.damsire === 'string'
            ? props.damsire
            : '',

      // TJK dışı / ek at özellikleri
      gender: parsedGender,
      breed:
        (typeof props.HORSE_BREED === 'string' && props.HORSE_BREED) ||
        (typeof props.STALLION_BREED === 'string' && props.STALLION_BREED) ||
        (typeof props.breed === 'string' && props.breed) ||
        (typeof props.studBreed === 'string' && props.studBreed) ||
        draft.details.breed,
      birthDate:
        (typeof props.BIRTH_DATE === 'string' && props.BIRTH_DATE) ||
        (typeof props.birthDate === 'string' && props.birthDate) ||
        draft.details.birthDate,
      age:
        props.HORSE_AGE != null
          ? String(props.HORSE_AGE)
          : props.STALLION_AGE != null
            ? String(props.STALLION_AGE)
            : props.age != null
              ? String(props.age)
              : props.studAge != null
                ? String(props.studAge)
                : draft.details.age,
      coatColor:
        (typeof props.COAT_COLOR === 'string' && props.COAT_COLOR) ||
        (typeof props.studCoatColor === 'string' && props.studCoatColor) ||
        (typeof props.coatColor === 'string' && props.coatColor) ||
        draft.details.coatColor,
      heightCm:
        props.HEIGHT_CM != null
          ? String(props.HEIGHT_CM)
          : props.heightCm != null
            ? String(props.heightCm)
            : draft.details.heightCm,
      sire:
        (typeof props.SIRE === 'string' && props.SIRE) ||
        (typeof props.studSire === 'string' && props.studSire) ||
        (typeof props.sire === 'string' && props.sire) ||
        draft.details.sire,
      dam:
        (typeof props.DAM === 'string' && props.DAM) ||
        (typeof props.studDam === 'string' && props.studDam) ||
        (typeof props.dam === 'string' && props.dam) ||
        draft.details.dam,
      damsire:
        (typeof props.DAMSIRE === 'string' && props.DAMSIRE) ||
        (typeof props.studDamSire === 'string' && props.studDamSire) ||
        (typeof props.studDamsire === 'string' && props.studDamsire) ||
        (typeof props.damsire === 'string' && props.damsire) ||
        draft.details.damsire,
      registeredName:
        (typeof props.REGISTERED_NAME === 'string' && props.REGISTERED_NAME) ||
        (typeof props.HORSE_NAME === 'string' && props.HORSE_NAME) ||
        (typeof props.studHorseName === 'string' && props.studHorseName) ||
        (typeof props.studHorse === 'string' && props.studHorse) ||
        (typeof props.registeredName === 'string' && props.registeredName) ||
        draft.details.registeredName,
      ownersText:
        (typeof props.OWNER === 'string' && props.OWNER) ||
        (typeof props.ownersText === 'string' && props.ownersText) ||
        draft.details.ownersText,
      breeder:
        (typeof props.BREEDER === 'string' && props.BREEDER) ||
        (typeof props.breeder === 'string' && props.breeder) ||
        draft.details.breeder,
      trainer:
        (typeof props.TRAINER === 'string' && props.TRAINER) ||
        (typeof props.trainer === 'string' && props.trainer) ||
        draft.details.trainer,
      tjkNumber:
        (typeof props.TJK_NUMBER === 'string' && props.TJK_NUMBER) ||
        (typeof props.tjkNumber === 'string' && props.tjkNumber) ||
        draft.details.tjkNumber,

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
